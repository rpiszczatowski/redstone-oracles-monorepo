use debug::PrintTrait;
use array::ArrayTrait;

use redstone::processor::process_payload;
use redstone::processor::Config;
use redstone::numbers::Felt252PartialOrd;

use demo::stark::sample_payload_bytes;
use demo::stark::SAMPLE_BLOCK_TIMESTAMP;
use demo::debug::ValuesPrint;
use demo::debug::GenericArrayPrintImpl;

#[available_gas(2000000)]
fn main() {
    let mut signers: Array<felt252> = ArrayTrait::new();

    let mut feed_ids = ArrayTrait::new();
    feed_ids.append('ETH');
    feed_ids.append('BTC');
    // feed_ids.append('XXX');

    let config = Config {
        block_timestamp: SAMPLE_BLOCK_TIMESTAMP,
        feed_ids: @feed_ids,
        signers: @signers,
        signer_count_threshold: 1_usize
    };

    let payload_bytes = sample_payload_bytes();
    let payload = process_payload(:payload_bytes, :config);

    payload.aggregated_values.print();

    return ();
}
