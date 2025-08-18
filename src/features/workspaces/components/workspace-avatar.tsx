import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { AvatarFallback } from "@radix-ui/react-avatar";
import Image from "next/image";

interface Props {
  image?: string;
  name: string;
  className?: string;
}

export const WorkspaceAvatar = ({ image, name, className }: Props) => {
  if (image) {
    return (
      <div
        className={cn("size-10 relative rounded-md overflow-hidden", className)}
      >
        <Image src={image} alt={name} fill className="object-cover" />
      </div>
    );
  }

  return (
    <Avatar className={cn("size-10 rounded-md", className)}>
      <AvatarFallback className="text-white bg-blue-600 font-semibold text-lg uppercase w-full items-center justify-center flex">
        {name[0]}
      </AvatarFallback>
    </Avatar>
  );
};
