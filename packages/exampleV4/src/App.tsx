import { twTree } from '@tailwind-tree/shared/utils/twTree.ts';

import Test from './test_1';

function App() {
  return (
    <div
      className={twTree([
        'flex h-full w-[100px] cursor-pointer bg-red-500 items-center justify-center ',
        {
          hover: 'bg-amber-900 w-[200px] h-12',
          md: 'w-[50px] bg-amber-300 h-10',
        },
      ])}
    >
      test
      <Test />
    </div>
  );
}

export default App;
