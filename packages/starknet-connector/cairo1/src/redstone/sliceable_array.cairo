use array::ArrayTrait;
use array::SpanTrait;
use array::ArrayTCloneImpl;
use option::OptionTrait;
use redstone::gas::out_of_gas_array;

struct ArraySlice<T> {
    head: @Array<T>,
    tail: @Array<T>,
}

impl ArraySliceCopy<T, impl TCopy: Copy<T>> of Copy<ArraySlice<T>>;
impl ArraySliceDrop<T, impl TDrop: Drop<T>> of Drop<ArraySlice<T>>;
impl ArrayCopy<T, impl TCopy: Copy<T>> of Copy<Array<T>>;

trait SliceableArrayTrait<T> {
    fn slice_tail_offset(self: @Array<T>, length: usize, offset: usize) -> ArraySlice<T>;
    fn slice_tail(self: @Array<T>, length: usize) -> ArraySlice<T>;
    fn copied(self: @Array<T>) -> Array<T>;
}

impl SliceableArray<T, impl TDrop: Drop<T>, impl TCopy: Copy<T>> of SliceableArrayTrait<T> {
    fn slice_tail_offset(self: @Array<T>, length: usize, offset: usize) -> ArraySlice<T> {
        assert(length + offset <= self.len(), 'Length or offset too big');

        let head_size = self.len() - offset - length;
        if (head_size == 0_usize) {
            return ArraySlice { head: @Default::default(), tail: self };
        }

        let span = self.span();

        let head = span.slice(0_usize, head_size).snapshot;
        let tail = span.slice(head_size, length).snapshot;

        ArraySlice { head, tail }
    }

    fn slice_tail(self: @Array<T>, length: usize) -> ArraySlice<T> {
        self.slice_tail_offset(length, 0_usize)
    }

    fn copied(self: @Array<T>) -> Array<T> {
        let mut arr = Default::default();
        array_copy(self, 0, ref arr);

        arr
    }
}

fn array_copy<T, impl TDrop: Drop<T>, impl TCopy: Copy<T>>(
    arr: @Array<T>, index: usize, ref res: Array<T>
) {
    match gas::withdraw_gas_all(get_builtin_costs()) {
        Option::Some(_) => {},
        Option::None(_) => panic(out_of_gas_array()),
    };

    if (index == arr.len()) {
        return ();
    }

    res.append(*arr[index]);
    array_copy(arr, index + 1_usize, ref res)
}

