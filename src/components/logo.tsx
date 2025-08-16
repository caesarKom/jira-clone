import Image from "next/image";

export const Logo = () => {
  return (
    <div className="flex gap-2 items-center">
      <Image src="/img/logo.png" alt="Logo" height={30} width={30} />
      <span className="text-xl font-bold">Jira-clone</span>
    </div>
  );
};
