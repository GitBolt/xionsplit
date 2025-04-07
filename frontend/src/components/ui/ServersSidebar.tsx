import React from 'react';
import Link from 'next/link';
import { PlusIcon, HomeIcon } from '@heroicons/react/24/solid';
import { usePathname } from 'next/navigation';

type ServerProps = {
  id: number;
  name: string;
  isActive: boolean;
  onClick?: () => void;
};

const ServerIcon: React.FC<ServerProps> = ({ id, name, isActive, onClick }) => {
  const initial = name.charAt(0).toUpperCase();
  
  return (
    <Link href={`/groups/${id}`} className="block mb-2">
      <div 
        className={`server-icon ${isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-primary/80 hover:text-primary-foreground'}`}
        onClick={onClick}
      >
        {initial}
      </div>
    </Link>
  );
};

type ServersSidebarProps = {
  servers: Array<{id: number; name: string}>;
  onCreateServerClick: () => void;
};

export default function ServersSidebar({ servers, onCreateServerClick }: ServersSidebarProps) {
  const pathname = usePathname();
  
  return (
    <div className="py-4 flex flex-col items-center">
      <Link href="/" className="block mb-4">
        <div className={`server-icon ${pathname === '/' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-primary/80 hover:text-primary-foreground'}`}>
          <HomeIcon className="h-6 w-6" />
        </div>
      </Link>
      
      <div className="w-8 h-0.5 bg-zinc-700 rounded-full my-2"></div>
      
      <div className="flex flex-col items-center space-y-2 overflow-y-auto max-h-[calc(100vh-180px)] w-full px-3">
        {servers.map(server => (
          <ServerIcon 
            key={server.id} 
            id={server.id} 
            name={server.name} 
            isActive={pathname === `/groups/${server.id}`}
          />
        ))}
      </div>
      
      <div className="mt-auto">
        <button 
          onClick={onCreateServerClick} 
          className="server-icon bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
} 