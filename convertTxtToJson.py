import os
import json
from datetime import datetime

def clean_domain(domain):
    # Remove any protocol prefix
    if '://' in domain:
        domain = domain.split('://')[-1]
    # Remove any path or query parameters
    domain = domain.split('/')[0]
    # Remove any whitespace
    domain = domain.strip()
    return domain

print("Starting conversion process...")

# Create necessary directories
os.makedirs('data', exist_ok=True)
os.makedirs('rules', exist_ok=True)

# Read and clean domains from blocklist.txt
with open('data/blocklist.txt', 'r') as f:
    all_domains = [clean_domain(line) for line in f if line.strip()]
    # Remove duplicates and empty lines
    all_domains = list(set(filter(None, all_domains)))

print(f"Total unique domains in blocklist: {len(all_domains)}")

# Create rules for the declarativeNetRequest API
rules = [{
    "id": 1,
    "priority": 1,
    "action": {
        "type": "block"
    },
    "condition": {
        "urlFilter": "||example.com^",  # Example domain as default rule
        "resourceTypes": ["main_frame"]
    }
}]

# Write rules to JSON file
with open('rules/rules.json', 'w') as f:
    json.dump(rules, f, indent=2)

# Save full domain list to a separate JSON file
with open('data/full_blocklist.json', 'w') as f:
    json.dump({
        "total_domains": len(all_domains),
        "domains": all_domains,
        "last_updated": datetime.now().isoformat()
    }, f, indent=2)

print(f"""
Conversion completed:
- Total unique domains: {len(all_domains)}
- Full blocklist saved to data/full_blocklist.json
- Rules saved to rules/rules.json
""")