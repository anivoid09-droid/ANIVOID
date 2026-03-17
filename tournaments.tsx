import { useState } from "react";
import { useListTournaments } from "@workspace/api-client-react";
import { useTournamentMutations } from "@/hooks/use-admin-mutations";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Play, SquareSquare } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  rewardType: z.enum(["coins", "card", "character", "premium"]),
  rewardValue: z.string().min(1),
});

export default function Tournaments() {
  const { data, isLoading } = useListTournaments();
  const { create, updateStatus, remove } = useTournamentMutations();
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", rewardType: "coins" as any, rewardValue: "1000" }
  });

  const onSubmit = (d: any) => {
    create.mutate({ data: d }, { onSuccess: () => setOpen(false) });
  };

  const getStatusColor = (s: string) => {
    if (s === 'active') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (s === 'ended') return 'bg-white/10 text-muted-foreground border-white/20';
    return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Tournaments" 
        description="Manage global game events and rewards."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/80"><Plus className="w-4 h-4 mr-2" /> New Tournament</Button>
            </DialogTrigger>
            <DialogContent className="glass-panel">
              <DialogHeader><DialogTitle>Create Tournament</DialogTitle></DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm">Name</label>
                  <Input className="bg-background/50" {...form.register("name")} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Reward Type</label>
                  <Select onValueChange={(v) => form.setValue("rewardType", v as any)} defaultValue={form.getValues("rewardType")}>
                    <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coins">Coins</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="character">Character</SelectItem>
                      <SelectItem value="premium">Premium Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Reward Value (Amount / Item Name)</label>
                  <Input className="bg-background/50" {...form.register("rewardValue")} />
                </div>
                <Button type="submit" className="w-full bg-primary" disabled={create.isPending}>Create</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="glass-panel rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-background/40">
            <TableRow className="border-white/5">
              <TableHead>Tournament Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reward</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow> : 
             data?.tournaments.map(t => (
               <TableRow key={t.id} className="border-white/5">
                 <TableCell className="font-medium text-foreground">{t.name}</TableCell>
                 <TableCell><Badge variant="outline" className={getStatusColor(t.status)}>{t.status}</Badge></TableCell>
                 <TableCell>
                   <span className="capitalize font-medium text-secondary">{t.rewardType}</span>
                   <span className="text-muted-foreground ml-2">({t.rewardValue})</span>
                 </TableCell>
                 <TableCell>{t.participantCount}</TableCell>
                 <TableCell className="text-right space-x-2">
                    {t.status === 'pending' && (
                      <Button size="sm" variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        onClick={() => updateStatus.mutate({ tournamentId: t.id, data: { status: 'active' } })}>
                        Start
                      </Button>
                    )}
                    {t.status === 'active' && (
                      <Button size="sm" variant="outline" className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                        onClick={() => updateStatus.mutate({ tournamentId: t.id, data: { status: 'ended' } })}>
                        End
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => { if(confirm('Delete?')) remove.mutate({ tournamentId: t.id }) }}>
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
