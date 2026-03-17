import { useState } from "react";
import { useListMarketItems, useListCharacters, useListCards } from "@workspace/api-client-react";
import { useMarketMutations } from "@/hooks/use-admin-mutations";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Store, Swords, Layers } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export default function Market() {
  const { data, isLoading } = useListMarketItems();
  const { data: chars } = useListCharacters();
  const { data: cards } = useListCards();
  const { add, remove } = useMarketMutations();
  const [open, setOpen] = useState(false);
  const [itemType, setItemType] = useState<"character" | "card">("character");

  const form = useForm({
    defaultValues: { itemId: "", price: "1000" }
  });

  const onSubmit = (d: any) => {
    add.mutate({ data: { itemType, itemId: parseInt(d.itemId), price: parseInt(d.price) } }, { onSuccess: () => setOpen(false) });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Global Market" 
        description="Manage available items in the bot's marketplace."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/80"><Plus className="w-4 h-4 mr-2" /> List Item</Button>
            </DialogTrigger>
            <DialogContent className="glass-panel">
              <DialogHeader><DialogTitle>Add to Market</DialogTitle></DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm">Item Type</label>
                  <Select onValueChange={(v) => setItemType(v as any)} defaultValue={itemType}>
                    <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="character">Character</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Select Item</label>
                  <Select onValueChange={(v) => form.setValue("itemId", v)}>
                    <SelectTrigger className="bg-background/50"><SelectValue placeholder="Choose item..."/></SelectTrigger>
                    <SelectContent>
                      {itemType === 'character' 
                        ? chars?.characters.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name} ({c.rarity})</SelectItem>)
                        : cards?.cards.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name} ({c.rarity})</SelectItem>)
                      }
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Market Price</label>
                  <Input type="number" className="bg-background/50" {...form.register("price")} />
                </div>
                <Button type="submit" className="w-full bg-primary" disabled={add.isPending}>List Item</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="glass-panel rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-background/40">
            <TableRow className="border-white/5">
              <TableHead>Type</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Stats</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow> : 
             data?.items.map(i => (
               <TableRow key={i.id} className="border-white/5">
                 <TableCell>
                    {i.itemType === 'character' ? <div className="flex items-center gap-2 text-primary"><Swords className="w-4 h-4"/> Character</div> : <div className="flex items-center gap-2 text-secondary"><Layers className="w-4 h-4"/> Card</div>}
                 </TableCell>
                 <TableCell>
                    <div className="font-bold text-foreground">{i.itemName || `ID: ${i.itemId}`}</div>
                    <div className="text-xs text-muted-foreground">{i.itemRarity}</div>
                 </TableCell>
                 <TableCell className="text-sm text-muted-foreground">Power: {i.itemPower}</TableCell>
                 <TableCell className="font-medium text-yellow-400">🪙 {i.price.toLocaleString()}</TableCell>
                 <TableCell className="text-right">
                    <Button size="icon" variant="ghost" className="hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => { if(confirm('Remove from market?')) remove.mutate({ marketId: i.id }) }}>
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
