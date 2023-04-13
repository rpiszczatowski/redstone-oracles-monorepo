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

## Revewing code
- Open files, to understand the whole picture
- Don't forget to read tests

## Helpful links
- https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/GUIDELINES.md
