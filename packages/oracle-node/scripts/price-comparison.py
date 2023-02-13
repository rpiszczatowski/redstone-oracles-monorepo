import json
redstone = open('../ETH-historical-prices-redstone.json')
redstone_data = json.load(redstone)
redstone.close()

other_provider = open('../ETH-historical-prices-chainlink.json') #change to any provider
other_data = json.load(other_provider)
other_provider.close()

#go through each timesamp and compare prices
# data must be in format {"price":10.96,"timestamp":1662561318}
maximal_accepted_timestamp_difference = 1000 #seconds we can change it to 1000 or 5000 if we want more or less strict comparison
round_decimals = 3 # we can change it to 2 or 4 if we want more or less decimals
max_devotion = 0
rounds_total = 0
rounds_skipped = 0
max_timestamp_diff = 0
redstone_iterator = iter(redstone_data)
other_iterator = iter(other_data)
try:
    while True:
        redstone_price = next(redstone_iterator)
        other_price = next(other_iterator)
        rounds_total+=1
        if redstone_price.get("timestamp") > other_price.get("timestamp") + maximal_accepted_timestamp_difference or redstone_price.get("timestamp") < other_price.get("timestamp") - maximal_accepted_timestamp_difference:
            print ("Timestamps are too different, skipping this round")
            rounds_skipped+=1
            continue
        max_timestamp_diff = max(max_timestamp_diff, abs(redstone_price.get("timestamp") - other_price.get("timestamp")))
        if redstone_price.get("price") > other_price.get("price"):
            max_devotion=max(max_devotion, (redstone_price.get("price") / other_price.get("price")))
        else:
            max_devotion=max(max_devotion, (other_price.get("price") / redstone_price.get("price")))
except StopIteration:
    pass

print (rounds_skipped,"rounds were skipped out of",rounds_total,"total rounds. It's",round(rounds_skipped/rounds_total*100, round_decimals),"%.")
print ("Maximal timestamp difference was",max_timestamp_diff,"seconds.")
print ("Maximal devotion in percentage is",round(max_devotion * 100 - 100, round_decimals),"%")
