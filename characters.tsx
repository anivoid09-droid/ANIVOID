import { useState } from "react";
import { useListCharacters } from "@workspace/api-client-react";
import { useCharacterMutations } from "@/hooks/use-admin-mutations";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Swords } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  rarity: z.string().min(1, "Rarity is required"),
  power: z.coerce.number().min(1),
  kills: z.coerce.number().min(0),
  skills: z.string().optional(),
  price: z.coerce.number().min(0),
});

function CharacterForm({ character, onClose }: { character?: any, onClose: () => void }) {
  const { create, update } = useCharacterMutations();
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: character || {
      name: "", rarity: "Common", power: 100, kills: 0, skills: "", price: 1000
    }
  });

  const onSubmit = (data: any) => {
    const payload = { ...data, image: imageFile || undefined };
    if (character) {
      update.mutate({ characterId: character.id, data: payload }, { onSuccess: onClose });
    } else {
      create.mutate({ data: payload }, { onSuccess: onClose });
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium">Character Name</label>
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
          <label className="text-sm font-medium">Power</label>
          <Input type="number" className="bg-background/50" {...form.register("power")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Base Kills</label>
          <Input type="number" className="bg-background/50" {...form.register("kills")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Price (Coins)</label>
          <Input type="number" className="bg-background/50" {...form.register("price")} />
        </div>
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium">Skills Description</label>
          <Input className="bg-background/50" {...form.register("skills")} />
        </div>
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium">Image Upload</label>
          <Input 
            type="file" 
            accept="image/*" 
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="bg-background/50 file:text-primary file:font-medium" 
          />
        </div>
      </div>
      <Button type="submit" className="w-full bg-primary hover:bg-primary/80" disabled={isPending}>
        {isPending ? "Saving..." : character ? "Update Character" : "Create Character"}
      </Button>
    </form>
  );
}

export default function Characters() {
  const { data, isLoading } = useListCharacters();
  const { remove } = useCharacterMutations();
  const [open, setOpen] = useState(false);
  const [editingChar, setEditingChar] = useState<any>(null);

  const handleCreate = () => { setEditingChar(null); setOpen(true); };
  const handleEdit = (c: any) => { setEditingChar(c); setOpen(true); };

  const getRarityColor = (r: string) => {
    if (r === 'Legendary') return 'text-orange-400 border-orange-400/30 bg-orange-400/10';
    if (r === 'Epic') return 'text-primary border-primary/30 bg-primary/10';
    if (r === 'Rare') return 'text-secondary border-secondary/30 bg-secondary/10';
    return 'text-muted-foreground border-white/10 bg-white/5';
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Characters" 
        description="Manage game characters and their stats."
        action={
          <Button onClick={handleCreate} className="bg-primary hover:bg-primary/80 shadow-lg shadow-primary/25">
            <Plus className="w-4 h-4 mr-2" /> Add Character
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-panel border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingChar ? "Edit Character" : "Create Character"}</DialogTitle>
          </DialogHeader>
          <CharacterForm character={editingChar} onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          <p>Loading...</p>
        ) : data?.characters.map((char) => (
          <div key={char.id} className="glass-card rounded-2xl overflow-hidden group">
            <div className="aspect-[4/3] bg-black/50 relative overflow-hidden flex items-center justify-center">
              {char.imagePath ? (
                <img src={char.imagePath} alt={char.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              ) : (
                <Swords className="w-12 h-12 text-muted-foreground/30" />
              )}
              <div className="absolute top-2 right-2">
                <span className={`text-xs px-2 py-1 rounded-md border backdrop-blur-md font-medium ${getRarityColor(char.rarity)}`}>
                  {char.rarity}
                </span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-lg font-bold text-foreground mb-1">{char.name}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><Swords className="w-3 h-3 text-secondary"/> {char.power}</span>
                <span>💀 {char.kills}</span>
                <span>🪙 {char.price}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1 bg-white/5 hover:bg-white/10" onClick={() => handleEdit(char)}>
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button variant="destructive" size="icon" onClick={() => {
                  if(confirm('Are you sure?')) remove.mutate({ characterId: char.id });
                }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
