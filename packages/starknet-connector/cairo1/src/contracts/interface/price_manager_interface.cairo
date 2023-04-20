use interface::round_data::RoundData;

#[abi]
trait IPriceManager {
    fn read_price(feed_id: felt252) -> felt252;
    fn read_round_data() -> RoundData;
    fn read_round_data_and_price(feed_id: felt252) -> (RoundData, felt252, );
}
