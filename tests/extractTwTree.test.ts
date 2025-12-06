import { describe, expect, it } from 'vitest';

import { extractTwTree } from '../packages/extractor/src';

// Define your test cases with **expected extracted classes**
const testCases = [
  {
    name: 'test1',
    source: "hover: 'bg-negative-light-2 h-[100px]',",
    expected: ['hover:bg-negative-light-2', 'hover:h-[100px]'],
  },
  {
    name: 'test2',
    source: "hover: ['bg-light-6', 'color-red']",
    expected: ['hover:bg-light-6', 'hover:color-red'],
  },
  {
    name: 'test3',
    source:
      'flex h-full min-w-[332px] cursor-pointer items-center rounded-lg p-6 transition-colors',
    expected: [
      'flex',
      'h-full',
      'min-w-[332px]',
      'cursor-pointer',
      'items-center',
      'rounded-lg',
      'p-6',
      'transition-colors',
    ],
  },
  {
    name: 'test4',
    source: "import { Tooltip } from 'antd';",
    expected: [],
  },
  {
    name: 'test5',
    source:
      "<Flex align='center' justify='space-between' className={twTree(['bg-white-ff', { hover: 'bg-red-500' }])}>",
    expected: ['bg-white-ff', 'center', 'hover:bg-red-500', 'space-between'],
  },
  {
    name: 'test6',
    source: '// InputDatePicker.stories.tsx',
    expected: [],
  },
  {
    name: 'test7',
    source: "className={twTree(['bg-white-ff', { hover: true? ['bg-red-500'] : ['bg-red-700'] }])}",
    expected: ['bg-white-ff', 'hover:bg-red-500', 'hover:bg-red-700'],
  },
  { name: 'test8', source: "<Icon name='time' />", expected: ['time'] },
  {
    name: 'test9',
    source: '<Flex className="items-center gap-1 ">',
    expected: ['items-center', 'gap-1'],
  },
  {
    name: 'test10',
    source: 'className="bg-white-ff z-10 mt-4 flex-wrap  rounded-t-lg "',
    expected: ['bg-white-ff', 'z-10', 'mt-4', 'flex-wrap', 'rounded-t-lg'],
  },
  {
    name: 'test11',
    source: '<Text color={colors.primary_light_2} {...textProps}>',
    expected: [],
  },
  {
    name: 'test12',
    source:
      'className={`text-primary h-7 w-7 rounded-full border ${false?"bg-red":"bg-blue"} ${card.badgeBgColor} p-1 text-center`}',
    expected: [
      'text-primary',
      'h-7',
      'w-7',
      'rounded-full',
      'border',
      'bg-red',
      'bg-blue',
      'p-1',
      'text-center',
    ],
  },
  { name: 'test13', source: 'className={twTree([ h-7 w-7 ', expected: ['h-7', 'w-7'] },
  {
    name: 'test14',
    source:
      'text-primary h-7 w-7 rounded-full border ${false?"bg-red":"bg-blue"} ${card.badgeBgColor} p-1 text-center',
    expected: [
      'text-primary',
      'h-7',
      'w-7',
      'rounded-full',
      'border',
      'bg-red',
      'bg-blue',
      'p-1',
      'text-center',
    ],
  },
  {
    name: 'test15',
    source: 'aggregation: { column: string; fun: StandardReportFieldAggregateFunction },',
    expected: [],
  },
  { name: 'test16', source: ' : { backgroundColor: colors.primary_light_1 }', expected: [] },
  { name: 'test17', source: 'information?: { id: string; name?: string };', expected: [] },
  { name: 'test18', source: 'case ReportFilterDisplayType.Stage: {', expected: [] },
  { name: 'test19', source: '[ReportFilterDisplayType.Category]: {', expected: [] },
  {
    name: 'test20',
    source: 'className={twTree([ "h-7 w-7", {hover: "text-red bg-pink" } ',
    expected: ['h-7', 'w-7', 'hover:text-red', 'hover:bg-pink'],
  },
];

describe('extractTwTree - all test cases', () => {
  testCases.forEach(({ name, source, expected }) => {
    it(`should correctly extract classes for ${name}`, () => {
      const extracted = extractTwTree()(source);
      expect(extracted.sort()).toEqual(expected.sort());
    });
  });
});
