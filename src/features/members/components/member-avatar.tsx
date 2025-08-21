import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { AvatarFallback } from "@radix-ui/react-avatar";

interface Props {
  fallbackClassName?: string;
  name: string;
  className?: string;
}

export const MemberAvatar = ({ fallbackClassName, name, className }: Props) => {
  return (
    <Avatar
      className={cn(
        "size-5 transition border border-neutral-300 bg-neutral-200 rounded-full flex items-center justify-center",
        className
      )}
    >
      <AvatarFallback
        className={cn(
          "font-medium text-neutral-500",
          fallbackClassName
        )}
      >
        {name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};
