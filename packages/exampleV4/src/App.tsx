import { twTree } from '@tailwind-tree/shared/utils/twTree.ts';

function App() {
  return (
    <div
      className={twTree([
        'flex h-full w-[100px] cursor-pointer bg-red-500 items-center justify-center ',
        {
          hover: ['bg-amber-900'],
          md: ['w-[50px]', 'bg-amber-300'],
          active: ['bg-green-800'],
        },
      ])}
    >
      test
    </div>
  );
}

export default App;
