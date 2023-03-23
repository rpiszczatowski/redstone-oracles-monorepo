use redstone::validation::validate_timestamp;

const BASE_TS: felt252 = 168000000;

#[test]
fn test_validate_proper_timestamps() {
    let mut i = 0;

    validate_timestamp(10, BASE_TS - MAX_DATA_TIMESTAMP_DELAY_SECONDS + i, BASE_TS);
    validate_timestamp(10, BASE_TS + MAX_DATA_TIMESTAMP_AHEAD_SECONDS - i, BASE_TS);

    i = 1;

    validate_timestamp(10, BASE_TS - MAX_DATA_TIMESTAMP_DELAY_SECONDS + i, BASE_TS);
    validate_timestamp(10, BASE_TS + MAX_DATA_TIMESTAMP_AHEAD_SECONDS - i, BASE_TS);
}


#[test(should_revert)]
fn test_validate_wrong_future_timestamp() {
    validate_timestamp(10, BASE_TS + MAX_DATA_TIMESTAMP_AHEAD_SECONDS + 1, BASE_TS);
}

#[test(should_revert)]
fn test_validate_wrong_past_timestamp() {
    validate_timestamp(10, BASE_TS - MAX_DATA_TIMESTAMP_DELAY_SECONDS - 1, BASE_TS);
}

