import { describe, expect, it } from 'vitest';

import { twTree } from '../packages/tailwind-tree/src/index';

describe('twTree', () => {
  it('should handle simple class array', () => {
    const result = twTree(['flex', 'h-full', 'text-center']);
    expect(result).toContain('flex');
    expect(result).toContain('h-full');
    expect(result).toContain('text-center');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    const result = twTree([
      'text-white',
      isActive ? 'bg-green-500' : 'bg-green-300',
      isDisabled ? 'opacity-50' : 'opacity-100',
    ]);

    expect(result).toContain('text-white');
    expect(result).toContain('bg-green-500');
    expect(result).toContain('opacity-100');
  });

  it('should handle nested objects for pseudo-classes', () => {
    const isFocused = true;
    const result = twTree([
      'text-white',
      {
        hover: ['bg-light-6', isFocused ? 'bg-blue-200' : 'bg-blue-100'],
        focus: ['ring-2', { visible: 'ring-green-500 ring-red-500' }],
      },
    ]);

    expect(result).toContain('text-white');
    expect(result).toContain('hover:bg-blue-200');
    expect(result).toContain('focus:ring-2');
    expect(result).not.toContain('focus:visible:ring-green-500'); // will get overrid by ring-red-500 (twMerge)
    expect(result).toContain('focus:visible:ring-red-500');
  });

  it('should handle arrays inside objects', () => {
    const result = twTree([
      {
        hover: ['underline opacity-50', { active: ['scale-105', 'font-semibold'] }],
      },
    ]);

    expect(result).toContain('hover:opacity-50');
    expect(result).toContain('hover:active:scale-105');
    expect(result).toContain('hover:active:font-semibold');
  });

  it('should handle complex runtime example', () => {
    const isActive = true;
    const isFocused = true;
    const isError = true;
    const anotherCondition = true;

    const result = twTree([
      'text-white',
      isActive ? 'bg-green-500' : 'bg-green-300',
      {
        ...(isActive
          ? {
              hover: [
                'underline',
                'opacity-50',
                isFocused ? 'bg-blue-200' : 'bg-blue-100',
                { active: ['scale-105', 'font-semibold'] },
              ],
            }
          : {
              focus: ['ring-2', { visible: ['ring-green-500', isError && 'ring-red-500'] }],
            }),
      },
      anotherCondition ? 'p-4' : 'p-2',
      ['font-bold', 'tracking-wide'],
    ]);

    expect(result).toContain('text-white');
    expect(result).toContain('bg-green-500');
    expect(result).toContain('hover:underline');
    expect(result).toContain('hover:opacity-50');
    expect(result).toContain('hover:bg-blue-200');
    expect(result).toContain('hover:active:scale-105');
    expect(result).toContain('hover:active:font-semibold');
    expect(result).toContain('p-4');
    expect(result).toContain('font-bold');
    expect(result).toContain('tracking-wide');
  });

  it('should merge conflicting classes when merge: false', () => {
    const result = twTree(['bg-red-500', 'bg-blue-500', 'text-white', 'text-black'], {
      merge: false,
    });

    // With twMerge, the **last class in conflict wins**
    expect(result).toContain('bg-blue-500');
    expect(result).toContain('bg-red-500');
    expect(result).toContain('text-black');
    expect(result).toContain('text-white');
  });

  it('should merge pseudo-classes correctly when merge: false', () => {
    const result = twTree(
      [
        {
          hover: ['bg-red-500', 'bg-blue-500'],
          focus: ['ring-2', 'ring-4'],
        },
      ],
      { merge: true },
    );

    // Last wins for each pseudo-class
    expect(result).toContain('hover:bg-blue-500');
    expect(result).not.toContain('hover:bg-red-500');
    expect(result).toContain('focus:ring-4');
    expect(result).not.toContain('focus:ring-2');
  });
});
