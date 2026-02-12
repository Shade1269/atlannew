import { useState } from "react";
import { User, Package, Heart, MapPin, Settings, LogOut, Edit2, Camera, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useLuxuryTheme } from './LuxuryThemeContext';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  joinedDate: string;
}

export interface Address {
  id: string;
  label: string;
  fullAddress: string;
  city: string;
  isDefault: boolean;
}

interface LuxuryProfileProps {
  user: UserProfile;
  addresses: Address[];
  stats: {
    orders: number;
    wishlist: number;
    reviews: number;
  };
  onEditProfile: (data: Partial<UserProfile>) => void;
  onAddAddress: () => void;
  onEditAddress: (id: string) => void;
  onDeleteAddress: (id: string) => void;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function LuxuryProfile({
  user,
  addresses,
  stats,
  onEditProfile,
  onAddAddress,
  onEditAddress,
  onDeleteAddress,
  onNavigate,
  onLogout,
}: LuxuryProfileProps) {
  const { colors } = useLuxuryTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user.name,
    phone: user.phone,
  });

  const handleSave = () => {
    onEditProfile(editData);
    setIsEditing(false);
  };

  const menuItems = [
    { id: "orders", icon: Package, label: "طلباتي", count: stats.orders },
    { id: "wishlist", icon: Heart, label: "المفضلة", count: stats.wishlist },
    { id: "addresses", icon: MapPin, label: "العناوين", count: addresses.length },
    { id: "settings", icon: Settings, label: "الإعدادات" },
  ];

  return (
    <div className="min-h-screen py-8" dir="rtl" style={{ background: colors.background, color: colors.text }}>
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 md:p-8 mb-8"
          style={{ 
            background: colors.backgroundSecondary, 
            border: `1px solid ${colors.border}`,
          }}
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12" style={{ color: colors.primaryText }} />
                )}
              </div>
              <button 
                className="absolute bottom-0 left-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: colors.primary }}
              >
                <Camera className="w-4 h-4" style={{ color: colors.primaryText }} />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-right">
              {isEditing ? (
                <div className="space-y-4 max-w-sm">
                  <Input
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    placeholder="الاسم"
                    style={{ 
                      background: colors.background,
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                    }}
                  />
                  <Input
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    placeholder="رقم الجوال"
                    style={{ 
                      background: colors.background,
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                    }}
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSave}
                      style={{ background: colors.buttonPrimary, color: colors.buttonText }}
                    >
                      حفظ
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      style={{ 
                        background: 'transparent',
                        border: `1px solid ${colors.border}`,
                        color: colors.text,
                      }}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
                  <p className="mb-1" style={{ color: colors.textSecondary }}>{user.email}</p>
                  <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>{user.phone}</p>
                  <p className="text-xs" style={{ color: colors.textMuted }}>
                    عضو منذ {user.joinedDate}
                  </p>
                </>
              )}
            </div>

            {/* Edit Button */}
            {!isEditing && (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="gap-2"
                style={{ 
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                }}
              >
                <Edit2 className="w-4 h-4" />
                تعديل
              </Button>
            )}
          </div>

          {/* Stats */}
          <div 
            className="grid grid-cols-3 gap-4 mt-8 pt-6"
            style={{ borderTop: `1px solid ${colors.border}` }}
          >
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: colors.primary }}>{stats.orders}</p>
              <p className="text-sm" style={{ color: colors.textMuted }}>طلب</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: colors.primary }}>{stats.wishlist}</p>
              <p className="text-sm" style={{ color: colors.textMuted }}>مفضلة</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: colors.primary }}>{stats.reviews}</p>
              <p className="text-sm" style={{ color: colors.textMuted }}>تقييم</p>
            </div>
          </div>
        </motion.div>

        {/* Menu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl overflow-hidden mb-8"
          style={{ 
            background: colors.backgroundSecondary, 
            border: `1px solid ${colors.border}`,
          }}
        >
          {menuItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="w-full flex items-center justify-between p-4 transition-colors"
              style={{ 
                borderBottom: index !== menuItems.length - 1 ? `1px solid ${colors.border}` : 'none',
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: colors.accentMuted }}
                >
                  <item.icon className="w-5 h-5" style={{ color: colors.primary }} />
                </div>
                <span className="font-medium">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.count !== undefined && (
                  <span 
                    className="px-2 py-1 rounded-full text-xs"
                    style={{ background: colors.backgroundTertiary, color: colors.textMuted }}
                  >
                    {item.count}
                  </span>
                )}
                <ChevronLeft className="w-5 h-5" style={{ color: colors.textMuted }} />
              </div>
            </button>
          ))}
        </motion.div>

        {/* Addresses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-6 mb-8"
          style={{ 
            background: colors.backgroundSecondary, 
            border: `1px solid ${colors.border}`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">العناوين المحفوظة</h2>
            <Button 
              onClick={onAddAddress} 
              size="sm"
              style={{ background: colors.buttonPrimary, color: colors.buttonText }}
            >
              إضافة عنوان
            </Button>
          </div>

          {addresses.length === 0 ? (
            <p className="text-center py-8" style={{ color: colors.textMuted }}>
              لا توجد عناوين محفوظة
            </p>
          ) : (
            <div className="space-y-3">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className="flex items-start justify-between p-4 rounded-xl"
                  style={{ background: colors.backgroundTertiary }}
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 mt-0.5" style={{ color: colors.primary }} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{address.label}</span>
                        {address.isDefault && (
                          <span 
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: colors.accentMuted, color: colors.primary }}
                          >
                            الافتراضي
                          </span>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: colors.textMuted }}>{address.fullAddress}</p>
                      <p className="text-sm" style={{ color: colors.textMuted }}>{address.city}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditAddress(address.id)}
                      style={{ color: colors.primary }}
                    >
                      تعديل
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteAddress(address.id)}
                      style={{ color: colors.error }}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="outline"
            onClick={onLogout}
            className="w-full gap-2"
            style={{ 
              background: 'transparent',
              border: `1px solid ${colors.error}`,
              color: colors.error,
            }}
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
