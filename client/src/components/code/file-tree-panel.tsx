import ExplorerActions from './explorer-actions'
import { useCodingStates } from '@/context/coding-states-provider';
import { PanelLeftIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { FileTree } from './file-tree';
import { EPanel } from '@/context/coding-states-provider/interface';

export default function FileTreePanel() {
    const { togglePanel } = useCodingStates();

    const isMobile = useIsMobile();

    return (
        <section className="@container bg-sidebar h-full">
            <section className="p-2 pl-4 flex justify-between items-center gap-1">
                <section className='flex items-center gap-2'>
                    {
                        isMobile && (
                            <Button variant={'ghost'} size={'icon'} type="button" onClick={() => togglePanel(EPanel.FileTree, false)}>
                                <PanelLeftIcon size={16} />
                            </Button>
                        )
                    }
                    <div className="text-sm font-medium uppercase">
                        Explorer
                    </div>
                </section>
                <div className="flex items-center gap-0.5 text-muted-foreground">
                    <ExplorerActions />
                </div>
            </section>
            <FileTree />
        </section>
    )
}