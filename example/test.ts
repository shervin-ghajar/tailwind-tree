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

const test1 = "hover: 'bg-negative-light-2 h-[100px]',";

const test3 =
  'flex h-full min-w-[332px] cursor-pointer items-center rounded-lg p-6 transition-colors';
const test4 = "import { Tooltip } from 'antd';";
const test5 =
  "<Flex align='center' justify='space-between' className={twTree(['bg-white-ff', { hover: 'bg-red-500' }])}>";
const test6 = '// InputDatePicker.stories.tsx';
const test7 = "className={twTree(['bg-white-ff', { hover: isTrue? 'bg-red-500' : 'bg-red-700' }])}";
const test8 = "<Icon name='time' />";
const test9 = '<Flex className="items-center gap-1 ">';
const test10 = 'className="bg-white-ff z-10 mt-4 flex-wrap  rounded-t-lg "';
const test11 = "badgeBorderColor: 'border-positive-light-2',";
const test12 =
  'className={`text-primary h-7 w-7 rounded-full border ${false?"bg-red":"bg-blue"} ${card.badgeBgColor} p-1 text-center`}';
const test13 = 'className={twTree([ h-7 w-7 ';
const test14 =
  'text-primary h-7 w-7 rounded-full border ${false?"bg-red":"bg-blue"} ${card.badgeBgColor} p-1 text-center';
const test15 = 'aggregation: { column: string; fun: StandardReportFieldAggregateFunction },';
const test16 = ' : { backgroundColor: colors.primary_light_1 }';
const test17 = 'information?: { id: string; name?: string };';
const test18 = 'case ReportFilterDisplayType.Stage: {';
const test19 = '[ReportFilterDisplayType.Category]: {';

// 1. Extract classes from a source string
const extractedClasses = extractTwTree()(test1);
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
