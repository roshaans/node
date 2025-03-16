#!/bin/bash
set -e

echo "Creating visor.json..."
printf '{ "chain": "Mainnet" }' > /home/hluser/visor.json
chown hluser:hluser /home/hluser/visor.json

echo "Creating override_gossip_config.json..."
printf '{
  "root_node_ips": [
    {"Ip": "20.188.6.225"}, {"Ip": "74.226.182.22"}, {"Ip": "57.182.103.24"},
    {"Ip": "3.115.170.40"}, {"Ip": "46.105.222.166"}, {"Ip": "91.134.41.52"},
    {"Ip": "57.180.50.253"}, {"Ip": "52.68.71.160"}, {"Ip": "13.114.116.44"},
    {"Ip": "199.254.199.190"}, {"Ip": "199.254.199.247"}, {"Ip": "45.32.32.21"},
    {"Ip": "157.90.207.92"}
  ],
  "try_new_peers": false,
  "chain": "Mainnet"
}' > /home/hluser/override_gossip_config.json
chown hluser:hluser /home/hluser/override_gossip_config.json

echo "Starting the node..."
exec /home/hluser/hl-visor run-non-validator --serve-eth-rpc

