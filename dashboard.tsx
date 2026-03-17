import { useGetDashboardStats } from "@workspace/api-client-react";
import { PageHeader } from "@/components/page-header";
import { Users, MessageSquare, Coins, Megaphone, Trophy, Swords, Layers, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

function StatCard({ title, value, icon: Icon, colorClass, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card p-6 rounded-2xl relative overflow-hidden group"
    >
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${colorClass}`} />
      
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-background/50 border border-white/5 ${colorClass.replace('bg-', 'text-')}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-3xl font-display font-bold text-foreground mt-1">{value?.toLocaleString() || "0"}</h3>
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard Overview" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl bg-card border-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-48 rounded-3xl overflow-hidden mb-8 shadow-2xl neon-border">
        <img 
          src={`${import.meta.env.BASE_URL}images/cyber-bg.png`} 
          alt="Dashboard Banner" 
          className="w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute bottom-6 left-8">
          <PageHeader 
            title="System Overview" 
            description="Real-time statistics for Anivoid RPG" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats?.totalUsers} icon={Users} colorClass="bg-primary" delay={0.1} />
        <StatCard title="Active Groups" value={stats?.totalGroups} icon={MessageSquare} colorClass="bg-secondary" delay={0.2} />
        <StatCard title="Economy (Coins)" value={stats?.totalCoins} icon={Coins} colorClass="bg-yellow-500" delay={0.3} />
        <StatCard title="Premium Users" value={stats?.premiumUsers} icon={Star} colorClass="bg-amber-400" delay={0.4} />
        
        <StatCard title="Characters" value={stats?.totalCharacters} icon={Swords} colorClass="bg-red-500" delay={0.5} />
        <StatCard title="Cards" value={stats?.totalCards} icon={Layers} colorClass="bg-emerald-500" delay={0.6} />
        <StatCard title="Active Ads" value={stats?.activeAds} icon={Megaphone} colorClass="bg-accent" delay={0.7} />
        <StatCard title="Tournaments" value={stats?.activeTournaments} icon={Trophy} colorClass="bg-orange-500" delay={0.8} />
      </div>
    </div>
  );
}
