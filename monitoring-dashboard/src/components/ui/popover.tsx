import type { ComponentProps } from 'react';
import { Popover as Primitive } from 'radix-ui';
import { cn } from 'cn';

const Popover = Primitive.Root;
const PopoverTrigger = Primitive.Trigger;
const PopoverClose = Primitive.Close;

function PopoverContent({ className, align = 'end', sideOffset = 10, ...props }: ComponentProps<typeof Primitive.Content>) {
  return <Primitive.Portal><Primitive.Content align={align} sideOffset={sideOffset}
    collisionPadding={12} className={cn('z-50 rounded-xl border bg-background p-4 shadow-lg outline-none', className)} {...props} /></Primitive.Portal>;
}

export { Popover, PopoverTrigger, PopoverClose, PopoverContent };
