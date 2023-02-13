import json
import matplotlib.pyplot as plt
cryptocurrency = "ETH" #change to any cryptocurrency
second_provider = "chainlink" #change to any provider
maximal_accepted_timestamp_difference = 1000 #seconds we can change it to 1000 or 5000 if we want more or less strict comparison
round_decimals = 3 # we can change it to 2 or 4 if we want more or less decimals

# data must be in format {"price":10.96,"timestamp":1662561318}
redstone = open('../{0}-historical-prices-redstone.json'.format(cryptocurrency))
redstone_data = json.load(redstone)
redstone.close()

other_provider = open('../{0}-historical-prices-{1}.json'.format(cryptocurrency, second_provider))
other_data = json.load(other_provider)
other_provider.close()

max_devotion , devotion , rounds_skipped, rounds_total, max_timestamp_diff = 0, 0, 0, 0, 0

redstone_iterator = iter(redstone_data)
other_iterator = iter(other_data)
#create a chart with timestamp and deviation
x, y = [], []

try:
    while True:
        redstone_price = next(redstone_iterator)
        other_price = next(other_iterator)
        rounds_total+=1
        if redstone_price.get("timestamp") > other_price.get("timestamp") + maximal_accepted_timestamp_difference or redstone_price.get("timestamp") < other_price.get("timestamp") - maximal_accepted_timestamp_difference:
            # print ("Timestamps are too different, skipping this round")
            rounds_skipped+=1
            continue
        max_timestamp_diff = max(max_timestamp_diff, abs(redstone_price.get("timestamp") - other_price.get("timestamp")))
        x.append(redstone_price.get("timestamp"))
        devotion = round(abs(redstone_price.get("price") - other_price.get("price")) / redstone_price.get("price") * 100, round_decimals)
        max_devotion=max(max_devotion, devotion)
        y.append(devotion)
except StopIteration:
    pass

print (rounds_skipped,"rounds were skipped out of",rounds_total,"total rounds. It's",round(rounds_skipped/rounds_total*100, round_decimals),"%.")
print ("Maximal timestamp difference was",max_timestamp_diff,"seconds.")
print ("Maximal devotion in percentage is",max_devotion,"%")

plt.plot(x, y)
plt.xlabel('Timestamp')
plt.ylabel('Devotion')
plt.title('Price comparison')
plt.savefig('../price-comparison.png', bbox_inches='tight')
# plt.show()
