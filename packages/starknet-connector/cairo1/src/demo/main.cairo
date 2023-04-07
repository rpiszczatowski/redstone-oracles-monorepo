use debug::PrintTrait;

use array::ArrayTrait;

use redstone::processor::process_payload;
use redstone::processor::Config;
use redstone::sort::SortableTrait;
use redstone::numbers::Felt252PartialOrd;

use demo::sample::sample_payload_bytes;
use demo::sample::SAMPLE_BLOCK_TIMESTAMP;
use demo::debug::ValuesPrint;
use demo::debug::GenericArrayPrintImpl;

fn main() {
    // let mut numbers = ArrayTrait::new();
    // numbers.append(13243);
    // numbers.append(23445);
    // numbers.append(123);
    // numbers.append(908);
    // numbers.append(90839);
    // numbers.append(123);

    // let sorted_numbers = numbers.sorted();
    // sorted_numbers.print();

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

    payload.print();

    return ();
}
