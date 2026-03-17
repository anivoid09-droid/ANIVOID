import { useState } from "react";
import { useListUsers } from "@workspace/api-client-react";
import { useUserMutations } from "@/hooks/use-admin-mutations";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const userSchema = z.object({
  coins: z.coerce.number().min(0),
  bank: z.coerce.number().min(0),
  xp: z.coerce.number().min(0),
  level: z.coerce.number().min(1),
  premiumUntil: z.string().optional().nullable(),
});

function EditUserDialog({ user }: { user: any }) {
  const { update } = useUserMutations();
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      coins: user.coins,
      bank: user.bank,
      xp: user.xp,
      level: user.level,
      premiumUntil: user.premiumUntil || "",
    }
  });

  const onSubmit = (data: any) => {
    update.mutate({ userId: user.userId, data }, {
      onSuccess: () => setOpen(false)
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:text-primary">
          <Edit2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-panel border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit User: {user.username || user.firstName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Coins</label>
              <Input type="number" className="bg-background/50" {...form.register("coins")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bank</label>
              <Input type="number" className="bg-background/50" {...form.register("bank")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Level</label>
              <Input type="number" className="bg-background/50" {...form.register("level")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">XP</label>
              <Input type="number" className="bg-background/50" {...form.register("xp")} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Premium Until (ISO Date)</label>
            <Input className="bg-background/50" placeholder="YYYY-MM-DD" {...form.register("premiumUntil")} />
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/80" disabled={update.isPending}>
            {update.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Users() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListUsers({ page: 1, limit: 50, search: search || undefined });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Users" 
        description="Manage player accounts, economy, and premium status."
      />

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by username or ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background/50 border-white/10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-background/40">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead>User</TableHead>
                <TableHead>Level / XP</TableHead>
                <TableHead>Economy</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>Inventory</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : data?.users.map((user) => (
                <TableRow key={user.userId} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell>
                    <div className="font-medium text-foreground">{user.username ? `@${user.username}` : user.firstName}</div>
                    <div className="text-xs text-muted-foreground">ID: {user.userId}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-secondary">Lv. {user.level}</div>
                    <div className="text-xs text-muted-foreground">{user.xp.toLocaleString()} XP</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">🪙 {user.coins.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">🏦 {user.bank.toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    {user.premiumUntil ? (
                      <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30">Premium</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Standard</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">⚔️ {user.charactersCount} Chars</div>
                    <div className="text-xs">🃏 {user.cardsCount} Cards</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(user.joinedAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <EditUserDialog user={user} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
