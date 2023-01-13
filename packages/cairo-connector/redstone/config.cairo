from redstone.utils.array import Array

struct Config {
    block_ts: felt,
    allowed_signer_addresses: Array,
    requested_feed_ids: Array,
    signer_count_treshold: felt,
}
