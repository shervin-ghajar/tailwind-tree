import { twTree } from 'tailwind-tree';

function App() {
  const withCondition = true;
  return (
    <div
      className={twTree([
        'flex h-full w-[100px] cursor-pointer bg-red-500 items-center justify-center ',
        {
          hover: 'bg-amber-900 w-[100px]',
          md: 'w-[50px] bg-amber-300',
          focus: [
            'ring-green-300',
            {
              visible: 'ring-green-500',
            },
          ],
        },
        withCondition ? 'bg-green-500' : 'bg-red-500',
      ])}
    >
      test
    </div>
  );
}

export default App;
