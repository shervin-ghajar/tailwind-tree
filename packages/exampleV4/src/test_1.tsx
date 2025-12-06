import { twTree } from '@tailwind-tree/shared/utils/twTree.ts';

function Test() {
  return (
    <div
      className={twTree([
        'flex h-full w-[100px] cursor-pointer bg-blue-100 items-center justify-center ',
        {
          hover: 'bg-amber-900 w-[200px] h-8',
        },
      ])}
    >
      test
    </div>
  );
}

export default Test;
