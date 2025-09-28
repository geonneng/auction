"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Image as ImageIcon, 
  Upload, 
  FileText, 
  Package,
  AlertCircle,
  CheckCircle,
  Eye,
  Plus,
  ChevronLeft
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"
import { useAuctionItem } from "@/contexts/auction-item-context"

interface AuctionItem {
  id: string
  name: string
  description: string
  image?: string
  roomId?: string
  createdBy?: string
  createdAt?: string
}

interface GuestSidebarProps {
  roomId: string
  guestName?: string
}

export function GuestSidebar({ roomId, guestName }: GuestSidebarProps) {
  const { getGuestItem, saveAuctionItem, isLoading } = useAuctionItem()
  const auctionItem = guestName ? getGuestItem(guestName) : null
  
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [itemName, setItemName] = useState("")
  const [itemDescription, setItemDescription] = useState("")
  const [itemImage, setItemImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // 기존 물품이 있으면 폼에 로드
  const loadExistingItem = () => {
    if (auctionItem) {
      setItemName(auctionItem.name)
      setItemDescription(auctionItem.description)
      setImagePreview(auctionItem.image || null)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setItemImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveItem = async () => {
    if (!itemName.trim()) {
      toast({
        title: "입력 오류",
        description: "경매 물품명을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    if (!guestName) {
      toast({
        title: "오류",
        description: "게스트 정보를 찾을 수 없습니다.",
        variant: "destructive",
      })
      return
    }
    
    try {
      await saveAuctionItem({
        name: itemName.trim(),
        description: itemDescription.trim(),
        image: imagePreview || undefined,
        roomId: roomId
      }, guestName)
      
      handleClearForm()
      setIsItemDialogOpen(false)
      
      toast({
        title: "저장 완료",
        description: "경매 물품 정보가 저장되었습니다.",
      })
    } catch (error) {
      toast({
        title: "저장 실패",
        description: "물품 정보 저장에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  const handleClearForm = () => {
    setItemName("")
    setItemDescription("")
    setItemImage(null)
    setImagePreview(null)
  }

  const openItemDialog = () => {
    loadExistingItem()
    setIsItemDialogOpen(true)
  }

  return (
    <>
      {/* 얇은 아이콘 사이드바 */}
      <aside className="fixed left-0 top-16 w-16 border-r border-stone-200 bg-stone-100/95 backdrop-blur-sm shadow-lg h-[calc(100vh-4rem)] z-40 flex flex-col items-center py-4 space-y-4">
        {/* 물품 등록 아이콘 */}
        <div className="flex flex-col items-center space-y-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={openItemDialog}
            className="w-12 h-12 rounded-xl transition-all duration-200 hover:bg-primary/10"
            title="경매 물품 등록"
          >
            {auctionItem ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
          </Button>
          <span className="text-xs font-medium text-muted-foreground text-center">
            경매물품
          </span>
        </div>
      </aside>

      {/* 물품 등록/수정 다이얼로그 */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-xl">
              <Package className="h-6 w-6" />
              <span>경매 물품 {auctionItem ? '수정' : '등록'}</span>
            </DialogTitle>
            <DialogDescription className="text-base">
              경매에 출품할 물품의 정보를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="item-name" className="text-base font-medium">물품명 *</Label>
              <Input
                id="item-name"
                placeholder="예: 빈티지 책상"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="text-base h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-description" className="text-base font-medium">물품 설명</Label>
              <Textarea
                id="item-description"
                placeholder="물품에 대한 상세한 설명을 입력해주세요..."
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                rows={4}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-image" className="text-base font-medium">물품 사진</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                {imagePreview ? (
                  <div className="space-y-3">
                    <img
                      src={imagePreview}
                      alt="미리보기"
                      className="w-full h-48 object-contain bg-stone-50 rounded-lg"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        setImagePreview(null)
                        setItemImage(null)
                      }}
                      className="w-full"
                    >
                      사진 제거
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        클릭하여 사진을 업로드하세요
                      </p>
                      <Input
                        id="item-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 현재 등록된 물품 정보 (수정 모드일 때) */}
            {auctionItem && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  이미 등록된 물품이 있습니다. 위 정보로 수정하시겠습니까?
                </AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsItemDialogOpen(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleSaveItem}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "저장 중..." : (auctionItem ? "수정하기" : "등록하기")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 등록된 물품 확인 다이얼로그 */}
      {auctionItem && (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed left-2 bottom-6 w-12 h-12 rounded-xl bg-primary/10 hover:bg-primary/20 z-50"
              title="등록된 물품 확인"
            >
              <Eye className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-xl">
                <Package className="h-6 w-6" />
                <span>내 경매 물품 정보</span>
              </DialogTitle>
              <DialogDescription className="text-base">
                현재 등록된 물품의 상세 정보입니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {auctionItem.image && (
                <div className="relative">
                  <img
                    src={auctionItem.image}
                    alt={auctionItem.name}
                    className="w-full h-80 object-contain bg-stone-50 rounded-xl shadow-lg"
                  />
                </div>
              )}
              <div className="space-y-4">
                <h3 className="font-bold text-2xl mb-4 text-center">{auctionItem.name}</h3>
                {auctionItem.description && (
                  <p className="text-lg leading-relaxed text-foreground bg-muted/30 p-4 rounded-lg">
                    {auctionItem.description}
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}