import { useState } from "react";
import { useListCards } from "@workspace/api-client-react";
import { useCardMutations } from "@/hooks/use-admin-mutations";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Layers } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1),
  rarity: z.string().min(1),
  power: z.coerce.number().min(1),
  skills: z.string().optional(),
  price: z.coerce.number().min(0),
});

function CardForm({ item, onClose }: { item?: any, onClose: () => void }) {
  const { create, update } = useCardMutations();
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: item || { name: "", rarity: "Common", power: 100, skills: "", price: 500 }
  });

  const onSubmit = (data: any) => {
    const payload = { ...data, image: imageFile || undefined };
    if (item) update.mutate({ cardId: item.id, data: payload }, { onSuccess: onClose });
    else create.mutate({ data: payload }, { onSuccess: onClose });
  };

  const isPending = create.isPending || update.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium">Card Name</label>
          <Input className="bg-background/50" {...form.register("name")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Rarity</label>
          <Select onValueChange={(v) => form.setValue("rarity", v)} defaultValue={form.getValues("rarity")}>
            <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Common">Common</SelectItem>
              <SelectItem value="Rare">Rare</SelectItem>
              <SelectItem value="Epic">Epic</SelectItem>
              <SelectItem value="Legendary">Legendary</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Power Bonus</label>
          <Input type="number" className="bg-background/50" {...form.register("power")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Price (Coins)</label>
          <Input type="number" className="bg-background/50" {...form.register("price")} />
        </div>
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium">Skills / Effects</label>
          <Input className="bg-background/50" {...form.register("skills")} />
        </div>
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium">Image Upload</label>
          <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="bg-background/50" />
        </div>
      </div>
      <Button type="submit" className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold" disabled={isPending}>
        {isPending ? "Saving..." : item ? "Update Card" : "Create Card"}
      </Button>
    </form>
  );
}

export default function Cards() {
  const { data, isLoading } = useListCards();
  const { remove } = useCardMutations();
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleCreate = () => { setEditingItem(null); setOpen(true); };
  const handleEdit = (c: any) => { setEditingItem(c); setOpen(true); };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Ability Cards" 
        description="Manage equippable cards and power-ups."
        action={
          <Button onClick={handleCreate} className="bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-lg shadow-secondary/25">
            <Plus className="w-4 h-4 mr-2" /> Add Card
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-panel border-secondary/20">
          <DialogHeader><DialogTitle className="text-xl">{editingItem ? "Edit Card" : "Create Card"}</DialogTitle></DialogHeader>
          <CardForm item={editingItem} onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {isLoading ? <p>Loading...</p> : data?.cards.map((card) => (
          <div key={card.id} className="glass-card rounded-2xl overflow-hidden border-t-2 border-t-secondary/50 group flex flex-col">
            <div className="aspect-[3/4] bg-gradient-to-br from-black/60 to-secondary/10 relative p-4 flex flex-col justify-between">
              {card.imagePath && <img src={card.imagePath} alt={card.name} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />}
              <div className="relative z-10 flex justify-between items-start">
                <Badge variant="outline" className="bg-black/50 backdrop-blur-sm border-secondary/30 text-secondary">{card.rarity}</Badge>
                <div className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center font-bold text-sm border border-white/10">
                  {card.power}
                </div>
              </div>
              <div className="relative z-10 text-center mt-auto pb-4">
                <h3 className="font-display font-bold text-lg leading-tight text-white drop-shadow-md">{card.name}</h3>
                <p className="text-xs text-secondary mt-1">{card.skills}</p>
              </div>
            </div>
            <div className="p-3 bg-card border-t border-white/5 flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1 hover:text-secondary" onClick={() => handleEdit(card)}><Edit className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" className="hover:text-destructive hover:bg-destructive/10" onClick={() => { if(confirm('Sure?')) remove.mutate({ cardId: card.id }) }}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
