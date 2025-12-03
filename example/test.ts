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
    'flex h-full min-w-[332px] cursor-pointer items-center rounded-lg p-6 transition-colors',
    {
      hover: ['bg-light-6'],
    },
    {
      hover: ['bg-red-500'],
    },
  ]);
`;

const test1 = "hover: ['bg-light-6','color-red'],";

const test3 =
  'flex h-full min-w-[332px] cursor-pointer items-center rounded-lg p-6 transition-colors';
const test4 = "import { Tooltip } from 'antd';";
const test5 =
  "<Flex align='center' justify='space-between' className={twTree(['bg-white-ff', { hover: ['bg-red-500'] }])}>";
const test6 = '// InputDatePicker.stories.tsx';
const test7 = "className={twTree(['bg-white-ff', { hover: ['bg-red-500'] }])}";
const test8 = "<Icon name='time' />";
const test9 = '<Flex className="items-center gap-1 ">';

// 1. Extract classes from a source string
const extractedClasses = extractTwTree()(test9);
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

console.log(
  'test',
  twTree([
    'flex h-full min-w-[332px] cursor-pointer items-center rounded-lg p-6 transition-colors',
    {
      hover: ['bg-light-6'],
    },
    {
      hover: ['bg-red-500'],
    },
  ]),
);
