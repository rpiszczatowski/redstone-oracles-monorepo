# Best practices

[DRAFT]

The goal of this document is to align best practices and coding style for Typescript, Javascript and Solidity code made by the RedStone team.

## Writing solid tests
- Start with creating a tests structure files and each test case descriptions (with no implementations)
- Review it, try to understand if there are any missed cases, that should be also tested. Add them if needed
- Start implementation, try to be as efficient as possible, if you see code duplication, move the common part to a separate function

## Writing clean code
- Start with interfaces, not implementation
- Even when you implement, try to keep each function code shorter than 20 lines, use helpful functions instead
- Implement helpful functions
- Spend more time thinking about function names. It does pay off in future

## Revewing code
- Open files, to understand the whole picture
- Don't forget to read tests

## Documentation
- Add comments to each part of the code that is not obvious for future readers
- Do not add stupid comments (e.g. `// This function adds 2 numbers` for the function called `add2Numbers`). Actually, always try to use good names for functions instead of commenting them

## Helpful links
- https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/GUIDELINES.md
