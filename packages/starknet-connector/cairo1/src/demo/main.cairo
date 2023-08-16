use debug::PrintTrait;
use array::ArrayTrait;

use redstone::processor::process_payload;
use redstone::processor::Config;
use redstone::numbers::Felt252PartialOrd;

use demo::test::sample_payload_bytes;
use demo::test::SAMPLE_BLOCK_TIMESTAMP;
use demo::debug::ValuesPrint;
use demo::debug::GenericArrayPrintImpl;

#[available_gas(2000000)]
fn main() {
    let mut signers: Array<felt252> = Default::default();
    signers.append(0xf786a909D559F5Dee2dc6706d8e5A81728a39aE9);

    let mut feed_ids = Default::default();
    feed_ids.append('ETH');
    // feed_ids.append('BTC');
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
