library processor;

dep protocol;
dep config;
dep config_validation;
dep aggregation;

use std::{bytes::*, logging::log, option::*, u256::U256, vec::*};

use protocol::Payload;
use config::Config;
use config_validation::*;
use aggregation::aggregate_results;

enum Entry {
    Value: U256,
    Empty: (),
}

pub fn process_input(bytes: Bytes, config: Config) -> Vec<U256> {
    let payload = Payload::from_bytes(bytes);
    config.validate_timestamps(payload);

    let matrix = get_payload_result_matrix(payload, config);
    let results = get_feed_values(matrix, config);

    config.validate_signer_count(results);

    let aggregated = aggregate_results(results);

    return aggregated;
}

fn get_feed_values(matrix: Vec<Entry>, config: Config) -> Vec<Vec<U256>> {
    let mut results = Vec::new();

    let mut f = 0;
    while (f < config.feed_ids.len) {
        let mut s = 0;
        let mut values = Vec::new();
        while (s < config.signers.len) {
            let index = config.index(f, s);
            match matrix.get(index).unwrap() {
                Entry::Value(value) => {
                    values.push(value);
                },
                Entry::Empty => (),
            }
            s += 1;
        }
        results.push(values);
        f += 1;
    }

    return results;
}

fn get_payload_result_matrix(payload: Payload, config: Config) -> Vec<Entry> {
    let mut i = 0;
    let mut j = 0;
    let mut results = Vec::new();

    while (i < config.cap()) {
        results.push(Entry::Empty);
        i += 1;
    }

    i = 0;
    while (i < payload.data_packages.len) {
        let data_package = payload.data_packages.get(i).unwrap();
        let s = config.validate_signer(data_package, i);

        j = 0;
        while (j < data_package.data_points.len) {
            let data_point = data_package.data_points.get(j).unwrap();
            let f = config.feed_id_index(data_point.feed_id);
            if f.is_none() {
                j += 1;
                continue;
            }

            let index = config.index(f.unwrap(), s);
            results.set(index, Entry::Value(data_point.value));
            j += 1;
        }

        i += 1;
    }

    return results;
}
