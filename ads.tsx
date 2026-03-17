import { useState } from "react";
import { useListAds } from "@workspace/api-client-react";
import { useAdMutations } from "@/hooks/use-admin-mutations";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Megaphone } from "lucide-react";
import { format } from "date-fns";

export default function AdsManager() {
  const { data, isLoading } = useListAds();
  const { create, update, toggle, remove } = useAdMutations();
  const [open, setOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);
  const [adText, setAdText] = useState("");

  const handleOpen = (ad: any = null) => {
    setEditingAd(ad);
    setAdText(ad ? ad.adText : "");
    setOpen(true);
  };

  const onSubmit = () => {
    if (editingAd) update.mutate({ adId: editingAd.id, data: { adText } }, { onSuccess: () => setOpen(false) });
    else create.mutate({ data: { adText, status: "active" } }, { onSuccess: () => setOpen(false) });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Ads Manager" 
        description="Configure automated broadcast messages for all groups."
        action={
          <Button onClick={() => handleOpen()} className="bg-accent hover:bg-accent/80 text-white shadow-lg shadow-accent/20">
            <Plus className="w-4 h-4 mr-2" /> Create Ad
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-panel border-accent/20">
          <DialogHeader><DialogTitle>{editingAd ? "Edit Ad" : "Create Ad"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ad Message Content (supports Telegram markdown)</label>
              <Textarea 
                className="bg-background/50 min-h-[150px]" 
                value={adText} 
                onChange={(e) => setAdText(e.target.value)}
                placeholder="Join our amazing channel! https://t.me/link"
              />
            </div>
            <Button onClick={onSubmit} className="w-full bg-accent hover:bg-accent/80" disabled={!adText}>Save Ad</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-background/40">
            <TableRow className="border-white/5">
              <TableHead className="w-[50%]">Message</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow> : 
             data?.ads.map(ad => (
               <TableRow key={ad.id} className="border-white/5">
                 <TableCell>
                    <div className="text-sm whitespace-pre-wrap font-mono bg-black/20 p-3 rounded-lg border border-white/5 text-muted-foreground">{ad.adText}</div>
                 </TableCell>
                 <TableCell className="text-sm text-muted-foreground">{format(new Date(ad.createdAt), "MMM d, yyyy")}</TableCell>
                 <TableCell>
                    <div className="flex items-center gap-3">
                      <Switch checked={ad.status === 'active'} onCheckedChange={() => toggle.mutate({ adId: ad.id })} />
                      <Badge variant="outline" className={ad.status === 'active' ? "border-accent text-accent" : "text-muted-foreground"}>
                        {ad.status}
                      </Badge>
                    </div>
                 </TableCell>
                 <TableCell className="text-right space-x-2">
                    <Button size="icon" variant="ghost" onClick={() => handleOpen(ad)}><Edit className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => { if(confirm('Delete ad?')) remove.mutate({ adId: ad.id }) }}>
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
