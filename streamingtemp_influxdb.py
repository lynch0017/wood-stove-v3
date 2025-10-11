#!/usr/bin/env python3
import time
import datetime
import os
import logging
from typing import Optional, Tuple
import influxdb_client
from influxdb_client.client.write_api import SYNCHRONOUS
import board
import busio
import digitalio
import adafruit_max31855
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class TemperatureSensor:
    def __init__(self, spi: busio.SPI, cs_pin: digitalio.DigitalInOut):
        """Initialize the MAX31855 temperature sensor."""
        self.sensor = adafruit_max31855.MAX31855(spi, cs_pin)
        self.retry_count = 3
        self.retry_delay = 1  # seconds

    def read_temperature(self) -> Optional[float]:
        """Read temperature with retry logic."""
        for attempt in range(self.retry_count):
            try:
                temp_c = self.sensor.temperature
                temp_f = (temp_c * 9/5) + 32
                return temp_f
            except Exception as e:
                logger.warning(f"Temperature reading attempt {attempt + 1} failed: {e}")
                if attempt < self.retry_count - 1:
                    time.sleep(self.retry_delay)
                continue
        return None

class InfluxDBLogger:
    def __init__(self):
        """Initialize InfluxDB connection."""
        self.url = os.getenv('INFLUXDB_URL')
        self.token = os.getenv('INFLUXDB_TOKEN')
        self.org = os.getenv('INFLUXDB_ORG')
        self.bucket = os.getenv('INFLUXDB_BUCKET')
        
        if not all([self.url, self.token, self.org, self.bucket]):
            raise ValueError("Missing required InfluxDB configuration")

        self.client = influxdb_client.InfluxDBClient(
            url=self.url,
            token=self.token,
            org=self.org
        )
        self.write_api = self.client.write_api(write_options=SYNCHRONOUS)

    def log_temperature(self, temperature: float) -> bool:
        """Log temperature to InfluxDB."""
        if not isinstance(temperature, (int, float)):
            logger.error("Invalid temperature value")
            return False

        try:
            point = influxdb_client.Point("temperature_measurement") \
                .tag("location", "catalyst") \
                .tag("sensor", "k-type-thermocouple") \
                .field("temperature", float(temperature)) \
                .time(datetime.datetime.utcnow())
            
            self.write_api.write(bucket=self.bucket, record=point)
            return True
        except Exception as e:
            logger.error(f"Failed to write to InfluxDB: {e}")
            return False

    def close(self):
        """Close InfluxDB connection."""
        self.client.close()

def main():
    """Main program loop."""
    try:
        # Initialize hardware
        spi = busio.SPI(board.SCK, MOSI=board.MOSI, MISO=board.MISO)
        cs = digitalio.DigitalInOut(board.D5)
        sensor = TemperatureSensor(spi, cs)
        logger = InfluxDBLogger()

        logger.info("Starting temperature monitoring...")
        logger.info("Press Ctrl+C to exit")

        while True:
            temp_f = sensor.read_temperature()
            
            if temp_f is not None:
                logger.info(f"Temperature: {temp_f:.2f}°F")
                if logger.log_temperature(temp_f):
                    logger.info("Data logged successfully")
                else:
                    logger.error("Failed to log data")
            else:
                logger.error("Failed to read temperature")
            
            time.sleep(5)

    except KeyboardInterrupt:
        logger.info("Shutting down...")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
    finally:
        if 'logger' in locals():
            logger.close()

if __name__ == "__main__":
    main()

