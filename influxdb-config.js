// InfluxDB Configuration Example
// Copy this file to influxdb-config.js and fill in your actual values

export const INFLUXDB_CONFIG = {
  // InfluxDB Cloud URL (e.g., https://us-east-1-1.aws.cloud2.influxdata.com)
  url: 'https://us-east-1-1.aws.cloud2.influxdata.com',

  // InfluxDB API Token (generate from InfluxDB Cloud dashboard)
  token: 'Z3Oqnu_Sk0QLV-jyf0kx1sMEzOZ9hABj34-RiXCLxAxCMm28PbIuMdUkBmbBLpcHbPO2zXaIfsBRuaEWnc2W9A==',

  // InfluxDB Organization name
  org: 'Dev Team',

  // InfluxDB Bucket name
  bucket: 'temperature_data'
};