import { useListGroups } from "@workspace/api-client-react";
import { useGroupMutations } from "@/hooks/use-admin-mutations";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Users } from "lucide-react";
import { format } from "date-fns";

export default function Groups() {
  const { data, isLoading } = useListGroups();
  const { remove } = useGroupMutations();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Registered Groups" 
        description="Telegram groups where the bot is currently active."
      />

      <div className="glass-panel rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-background/40">
            <TableRow className="border-white/5">
              <TableHead>Group Name</TableHead>
              <TableHead>Chat ID</TableHead>
              <TableHead>Added Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow> : 
             data?.groups.map(g => (
               <TableRow key={g.id} className="border-white/5">
                 <TableCell className="font-medium text-foreground flex items-center gap-2">
                   <Users className="w-4 h-4 text-secondary" />
                   {g.groupName || "Unknown Group"}
                 </TableCell>
                 <TableCell className="font-mono text-sm text-muted-foreground">{g.chatId}</TableCell>
                 <TableCell className="text-sm text-muted-foreground">{format(new Date(g.addedAt), "MMM d, yyyy")}</TableCell>
                 <TableCell className="text-right">
                    <Button size="icon" variant="ghost" className="hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => { if(confirm('Delete group from DB?')) remove.mutate({ groupId: g.id }) }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                 </TableCell>
               </TableRow>
             ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
