#!/usr/bin/env python3
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import influxdb_client
from influxdb_client.client.query_api import QueryApi
import os
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    load_dotenv(env_path)
    print(f"✓ Loaded .env file from {env_path}")
else:
    print(f"⚠ Warning: .env file not found at {env_path}")
    print("  Please create a .env file with your API keys")

# Check for required environment variables
required_vars = ['OPENAI_API_KEY', 'INFLUXDB_URL', 'INFLUXDB_TOKEN', 'INFLUXDB_ORG', 'INFLUXDB_BUCKET']
missing_vars = [var for var in required_vars if not os.getenv(var)]

if missing_vars:
    print(f"\n❌ Error: Missing required environment variables: {', '.join(missing_vars)}")
    print("\nPlease add these to your .env file:")
    for var in missing_vars:
        print(f"  {var}=your_value_here")
    print("\nExiting...")
    exit(1)

print("✓ All required environment variables found")

app = Flask(__name__)
CORS(app)  # Enable CORS for React app
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# InfluxDB setup with increased timeout
influx_client = influxdb_client.InfluxDBClient(
    url=os.getenv('INFLUXDB_URL'),
    token=os.getenv('INFLUXDB_TOKEN'),
    org=os.getenv('INFLUXDB_ORG'),
    timeout=30000  # 30 second timeout (in milliseconds)
)
query_api = influx_client.query_api()

# Tool definitions for OpenAI (using modern tools API instead of legacy functions)
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_current_temperature",
            "description": "Get the most recent temperature reading from the wood stove catalyst",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_temperature_history",
            "description": "Get summarized temperature history for a specified time range. Returns aggregated data points (30-min averages) to show trends without overwhelming detail.",
            "parameters": {
                "type": "object",
                "properties": {
                    "hours": {
                        "type": "integer",
                        "description": "Number of hours to look back (default 24)"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_temperature_stats",
            "description": "Get statistical analysis (min, max, average) for a time period",
            "parameters": {
                "type": "object",
                "properties": {
                    "hours": {
                        "type": "integer",
                        "description": "Number of hours to analyze (default 24)"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "find_last_fire",
            "description": "Find when the stove was last used. Searches for temperatures above 400°F which indicates an active fire.",
            "parameters": {
                "type": "object",
                "properties": {
                    "days_back": {
                        "type": "integer",
                        "description": "Number of days to search back (default 7)"
                    }
                },
                "required": []
            }
        }
    }
]

def get_current_temperature():
    """Query InfluxDB for the most recent temperature."""
    try:
        query = f'''
        from(bucket: "{os.getenv('INFLUXDB_BUCKET')}")
            |> range(start: -1h)
            |> filter(fn: (r) => r["_measurement"] == "temperature_measurement")
            |> filter(fn: (r) => r["_field"] == "temperature")
            |> last()
        '''
        result = query_api.query(query=query)
        
        if result and len(result) > 0 and len(result[0].records) > 0:
            record = result[0].records[0]
            return {
                "temperature": round(record.get_value(), 2),
                "time": record.get_time().isoformat(),
                "location": record.values.get("location")
            }
        return {"error": "No recent data found"}
    except Exception as e:
        return {"error": f"Failed to fetch current temperature: {str(e)}"}

def get_temperature_history(hours=24):
    """Query InfluxDB for temperature history (summarized to avoid token limits)."""
    try:
        # Use larger aggregation windows for longer time periods
        if hours > 48:
            window = "2h"
        elif hours > 24:
            window = "1h"
        else:
            window = "30m"
        
        query = f'''
        from(bucket: "{os.getenv('INFLUXDB_BUCKET')}")
            |> range(start: -{hours}h)
            |> filter(fn: (r) => r["_measurement"] == "temperature_measurement")
            |> filter(fn: (r) => r["_field"] == "temperature")
            |> aggregateWindow(every: {window}, fn: mean, createEmpty: false)
            |> limit(n: 50)
        '''
        result = query_api.query(query=query)
        
        readings = []
        if result:
            for table in result:
                for record in table.records:
                    readings.append({
                        "temperature": round(record.get_value(), 2),
                        "time": record.get_time().isoformat()
                    })
        
        return {
            "readings": readings, 
            "count": len(readings), 
            "hours": hours,
            "aggregation_window": window,
            "note": f"Data aggregated in {window} windows for efficiency"
        }
    except Exception as e:
        return {
            "error": f"Failed to fetch history: {str(e)}",
            "readings": [],
            "count": 0
        }

def get_temperature_stats(hours=24):
    """Query InfluxDB for temperature statistics."""
    queries = {
        "mean": f'''
            from(bucket: "{os.getenv('INFLUXDB_BUCKET')}")
                |> range(start: -{hours}h)
                |> filter(fn: (r) => r["_measurement"] == "temperature_measurement")
                |> filter(fn: (r) => r["_field"] == "temperature")
                |> mean()
        ''',
        "max": f'''
            from(bucket: "{os.getenv('INFLUXDB_BUCKET')}")
                |> range(start: -{hours}h)
                |> filter(fn: (r) => r["_measurement"] == "temperature_measurement")
                |> filter(fn: (r) => r["_field"] == "temperature")
                |> max()
        ''',
        "min": f'''
            from(bucket: "{os.getenv('INFLUXDB_BUCKET')}")
                |> range(start: -{hours}h)
                |> filter(fn: (r) => r["_measurement"] == "temperature_measurement")
                |> filter(fn: (r) => r["_field"] == "temperature")
                |> min()
        '''
    }
    
    stats = {"hours": hours}
    for stat_name, query in queries.items():
        result = query_api.query(query=query)
        if result and len(result) > 0 and len(result[0].records) > 0:
            stats[stat_name] = round(result[0].records[0].get_value(), 2)
    
    return stats

def find_last_fire(days_back=7):
    """Find the last time the stove was used (temperature > 400°F indicates active fire)."""
    try:
        query = f'''
        from(bucket: "{os.getenv('INFLUXDB_BUCKET')}")
            |> range(start: -{days_back}d)
            |> filter(fn: (r) => r["_measurement"] == "temperature_measurement")
            |> filter(fn: (r) => r["_field"] == "temperature")
            |> filter(fn: (r) => r._value > 400.0)
            |> last()
        '''
        result = query_api.query(query=query)
        
        if result and len(result) > 0 and len(result[0].records) > 0:
            record = result[0].records[0]
            return {
                "last_fire_time": record.get_time().isoformat(),
                "temperature_at_that_time": round(record.get_value(), 2),
                "days_searched": days_back,
                "note": "Fire detected when temperature exceeded 400°F"
            }
        return {
            "last_fire_time": None,
            "note": f"No fire detected in the last {days_back} days (no temps > 400°F)"
        }
    except Exception as e:
        return {
            "error": f"Failed to search for last fire: {str(e)}",
            "last_fire_time": None
        }

# Map function names to actual functions
available_functions = {
    "get_current_temperature": get_current_temperature,
    "get_temperature_history": get_temperature_history,
    "get_temperature_stats": get_temperature_stats,
    "find_last_fire": find_last_fire
}

@app.route('/api/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message')
    conversation_history = request.json.get('history', [])
    
    # Add user message to history
    messages = conversation_history + [{"role": "user", "content": user_message}]
    
    try:
        # Initial API call
        # Model options: "gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo", "gpt-5-nano", "gpt-5-mini"
        # Note: Using modern tools API (works with all current models)
        response = client.chat.completions.create(
            model="gpt-5-mini",  # GPT-5 mini - good balance of speed and capability
            messages=[
                {"role": "system", "content": """You are a specialized assistant for wood stove temperature monitoring and operation. 
                The data comes from a K-type thermocouple monitoring the catalyst temperature. 
                You can query current temperatures, historical data, and provide insights about burning efficiency and safety.
                Typical catalyst temperatures range from 500-1500°F during active burning.
                When the stove is not in use, temperatures will be close to room temperature.
                
                SCOPE: You ONLY answer questions about:
                - Wood stove operation, temperature, and safety
                - Burning firewood (techniques, efficiency, problems)
                - Wood species and their burning characteristics
                - Catalyst operation and maintenance
                - Fire management and heating
                
                If asked about anything outside this scope, politely decline and state you only assist with wood stove related questions.
                
                IMPORTANT: Provide direct, concise answers. Answer the question asked, then STOP. 
                Do NOT offer follow-up suggestions, additional options, or ask what they'd prefer next."""},
            ] + messages,
            tools=tools,
            tool_choice="auto"
        )
        
        response_message = response.choices[0].message
        
        # Check if the model wants to call a tool
        if response_message.tool_calls:
            # Get the first tool call
            tool_call = response_message.tool_calls[0]
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)
            
            # Call the function
            function_response = available_functions[function_name](**function_args)
            
            # Send tool response back to the model
            messages.append({
                "role": "assistant",
                "content": None,
                "tool_calls": [
                    {
                        "id": tool_call.id,
                        "type": "function",
                        "function": {
                            "name": function_name,
                            "arguments": tool_call.function.arguments
                        }
                    }
                ]
            })
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(function_response)
            })
            
            # Get final response
            second_response = client.chat.completions.create(
                model="gpt-5-mini",  # Same model as initial call
                messages=[
                    {"role": "system", "content": """You are a specialized assistant for wood stove temperature monitoring and operation. 
                    The data comes from a K-type thermocouple monitoring the catalyst temperature. 
                    You can query current temperatures, historical data, and provide insights about burning efficiency and safety.
                    Typical catalyst temperatures range from 500-1500°F during active burning.
                    When the stove is not in use, temperatures will be close to room temperature.
                    
                    SCOPE: You ONLY answer questions about:
                    - Wood stove operation, temperature, and safety
                    - Burning firewood (techniques, efficiency, problems)
                    - Wood species and their burning characteristics
                    - Catalyst operation and maintenance
                    - Fire management and heating
                    
                    If asked about anything outside this scope, politely decline and state you only assist with wood stove related questions.
                    
                    IMPORTANT: Provide direct, concise answers. Answer the question asked, then STOP. 
                    Do NOT offer follow-up suggestions, additional options, or ask what they'd prefer next."""},
                ] + messages
            )
            
            return jsonify({
                "response": second_response.choices[0].message.content,
                "history": messages
            })
        
        return jsonify({
            "response": response_message.content,
            "history": messages
        })
    
    except Exception as e:
        return jsonify({
            "response": f"I encountered an error: {str(e)}",
            "history": messages
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

