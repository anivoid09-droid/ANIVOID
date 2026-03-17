import { useListGuilds } from "@workspace/api-client-react";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield } from "lucide-react";

export default function Guilds() {
  const { data, isLoading } = useListGuilds();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Guilds Leaderboard" 
        description="Overview of player-created guilds and alliances."
      />

      <div className="glass-panel rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-background/40">
            <TableRow className="border-white/5">
              <TableHead>Guild Name</TableHead>
              <TableHead>Owner ID</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Treasury</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow> : 
             data?.guilds.map(g => (
               <TableRow key={g.id} className="border-white/5">
                 <TableCell className="font-bold text-primary flex items-center gap-2">
                   <Shield className="w-4 h-4" />
                   {g.name}
                 </TableCell>
                 <TableCell className="font-mono text-sm text-muted-foreground">{g.ownerId}</TableCell>
                 <TableCell className="font-medium text-secondary">Lv. {g.level}</TableCell>
                 <TableCell>{g.memberCount} players</TableCell>
                 <TableCell className="text-yellow-400 font-medium">🪙 {g.coins.toLocaleString()}</TableCell>
               </TableRow>
             ))}
             {data?.guilds.length === 0 && (
               <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No guilds exist yet.</TableCell></TableRow>
             )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
