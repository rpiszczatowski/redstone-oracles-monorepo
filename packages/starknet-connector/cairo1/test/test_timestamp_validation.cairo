use redstone::timestamp_validation::validate_timestamp;
use redstone::timestamp_validation::MAX_DATA_TIMESTAMP_DELAY_SECONDS;
use redstone::timestamp_validation::MAX_DATA_TIMESTAMP_AHEAD_SECONDS;
use integer::TryInto;
use option::OptionTrait;

const BASE_TS: felt252 = 168000000;

#[test]
fn test_validate_proper_timestamps() {
    let mut i = 0;

    let base_ts: u64 = BASE_TS.try_into().unwrap();

    validate_timestamp(10_usize, BASE_TS - MAX_DATA_TIMESTAMP_DELAY_SECONDS + i, base_ts);
    validate_timestamp(10_usize, BASE_TS + MAX_DATA_TIMESTAMP_AHEAD_SECONDS - i, base_ts);

    i = 1;

    validate_timestamp(10_usize, BASE_TS - MAX_DATA_TIMESTAMP_DELAY_SECONDS + i, base_ts);
    validate_timestamp(10_usize, BASE_TS + MAX_DATA_TIMESTAMP_AHEAD_SECONDS - i, base_ts);
}


#[test]
#[should_panic]
fn test_validate_wrong_future_timestamp() {
    validate_timestamp(
        10_usize, BASE_TS + MAX_DATA_TIMESTAMP_AHEAD_SECONDS + 1, BASE_TS.try_into().unwrap()
    );
}

#[test]
#[should_panic]
fn test_validate_wrong_past_timestamp() {
    validate_timestamp(
        10_usize, BASE_TS - MAX_DATA_TIMESTAMP_DELAY_SECONDS - 1, BASE_TS.try_into().unwrap()
    );
}

