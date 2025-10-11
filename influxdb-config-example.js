// InfluxDB Configuration Example
// Copy this file to influxdb-config.js and fill in your actual values

export const INFLUXDB_CONFIG = {
  // InfluxDB Cloud URL (e.g., https://us-east-1-1.aws.cloud2.influxdata.com)
  url: 'https://us-east-1-1.aws.cloud2.influxdata.com',

  // InfluxDB API Token (generate from InfluxDB Cloud dashboard)
  token: 'your_influxdb_token_here',

  // InfluxDB Organization name
  org: 'your_org_name',

  // InfluxDB Bucket name
  bucket: 'temperature_bucket'
};
