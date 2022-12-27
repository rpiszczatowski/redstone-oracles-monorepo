import { Aggregator, PriceDataAfterAggregation, PriceDataBeforeAggregation } from "../types";

const allEqualAggregator: Aggregator = {
    getAggregatedValue: (data: PriceDataBeforeAggregation): PriceDataAfterAggregation => {
        const value = extractValueIfAllEqual(Object.values(data.source));
        return {
            ...data,
            value
        }
    }
}

function extractValueIfAllEqual(values: number[]) {
    if (values.length === 0) {
        throw Error("Cannot get value of an empty array");
    }

    const first = values[0];

    const allEqual = values.every(value => value === first);

    if (!allEqual) {
        throw new Error("All values in array are not equal");
    }

    return first;
}

export default allEqualAggregator;