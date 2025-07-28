import { extractTwTree } from '../packages/extractor/src';
import { generateTwSafelist } from '../packages/shared/src/utils/generateTwSafelist';
import { twTree } from '../packages/tailwind-tree/src';

// Example source string containing twTree usage
const exampleSource = `
import { twTree } from 'tailwind-tree';

const isActive = true;
const isFocused = true;
const isError = true;
const anotherCondition = true;
twTree([
  'text-white',
  isActive ? "bg-green-500" : 'bg-green-300',
  {
    ...(isActive
      ? {
          hover: [
            'underline',
            'opacity-50',
            isFocused ? 'bg-blue-200' : "bg-blue-100",
            {
              active: ['scale-105', "font-semibold"],
            },
          ],
        }
      : {
          focus: [
            'ring-2',
            {
              visible: ['ring-green-500', isError && "ring-red-500"],
            },
          ],
        }),
  },
  anotherCondition ? 'p-4' : 'p-2',
  ['font-bold', "tracking-wide"],
]);
`;

// 1. Extract classes from a source string
const extractedClasses = extractTwTree()(exampleSource);
console.log('Extracted classes:', extractedClasses);

// 2. Run generateTwSafelist to scan all source files & write safelist
// (Make sure this script is run from project root)
generateTwSafelist()
  .then(() => {
    console.log('Safelist generated successfully.');
  })
  .catch((err) => {
    console.error('Error generating safelist:', err);
  });
// Example
const isActive = true;
const isFocused = true;
const isError = true;
const anotherCondition = true;
twTree([
  'text-white',
  isActive ? `bg-green-500` : 'bg-green-300',
  {
    ...(isActive
      ? {
          hover: [
            'underline',
            'opacity-50',
            isFocused ? 'bg-blue-200' : `bg-blue-100`,
            {
              active: ['scale-105', `font-semibold`],
            },
          ],
        }
      : {
          focus: [
            'ring-2',
            {
              visible: ['ring-green-500', isError && `ring-red-500`],
            },
          ],
        }),
  },
  anotherCondition ? 'p-4' : 'p-2',
  ['font-bold', `tracking-wide`],
]);
