"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Image as ImageIcon, 
  Upload, 
  FileText, 
  Package,
  AlertCircle,
  CheckCircle,
  Eye
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"
import { useAuctionItem } from "@/contexts/auction-item-context"

interface AuctionItem {
  id: string
  name: string
  description: string
  image?: string
}

interface GuestSidebarProps {
  roomId: string
  guestName?: string
}

export function GuestSidebar({ roomId, guestName }: GuestSidebarProps) {
  const { getGuestItem, saveAuctionItem, isLoading } = useAuctionItem()
  const auctionItem = guestName ? getGuestItem(guestName) : null
  const [isEditingItem, setIsEditingItem] = useState(false)
  const [itemName, setItemName] = useState("")
  const [itemDescription, setItemDescription] = useState("")
  const [itemImage, setItemImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB 제한
        toast({
          title: "파일 크기 오류",
          description: "이미지 파일은 5MB 이하로 업로드해주세요.",
          variant: "destructive",
        })
        return
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "파일 형식 오류",
          description: "이미지 파일만 업로드 가능합니다.",
          variant: "destructive",
        })
        return
      }

      setItemImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
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
      
      setIsEditingItem(false)
      setItemName("")
      setItemDescription("")
      setItemImage(null)
      setImagePreview(null)
      
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

  const handleEditItem = () => {
    if (auctionItem) {
      setItemName(auctionItem.name)
      setItemDescription(auctionItem.description)
      setImagePreview(auctionItem.image || null)
    }
    setIsEditingItem(true)
  }

  const handleCancelEdit = () => {
    setIsEditingItem(false)
    setItemName("")
    setItemDescription("")
    setItemImage(null)
    setImagePreview(null)
  }

  return (
    <aside className="fixed left-0 top-20 w-80 border-r bg-gradient-to-b from-background/95 to-muted/20 backdrop-blur-sm p-6 space-y-6 shadow-lg h-[calc(100vh-5rem)] overflow-y-auto z-40">
      <div className="flex items-center space-x-2 mb-6">
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
          <Package className="h-4 w-4 text-primary-foreground" />
        </div>
        <h2 className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          경매 물품
        </h2>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>물품 정보</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {auctionItem && !isEditingItem ? (
            <div className="space-y-4">
              {auctionItem.image && (
                <div className="relative">
                  <img
                    src={auctionItem.image}
                    alt={auctionItem.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg">{auctionItem.name}</h3>
                {auctionItem.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {auctionItem.description}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      크게 보기
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
                            className="w-full h-80 object-cover rounded-xl shadow-lg"
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
                
                <Button
                  onClick={handleEditItem}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  수정하기
                </Button>
              </div>
            </div>
          ) : isEditingItem ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="item-name">물품명</Label>
                <Input
                  id="item-name"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="경매할 물품명을 입력하세요"
                  maxLength={50}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="item-description">설명</Label>
                <Textarea
                  id="item-description"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="물품에 대한 설명을 입력하세요"
                  rows={3}
                  maxLength={200}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="item-image">이미지</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                  {imagePreview ? (
                    <div className="space-y-2">
                      <img
                        src={imagePreview}
                        alt="미리보기"
                        className="w-full h-24 object-cover rounded-lg mx-auto"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setImagePreview(null)
                          setItemImage(null)
                        }}
                      >
                        이미지 제거
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        이미지를 업로드하세요
                      </p>
                      <Input
                        id="item-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('item-image')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        파일 선택
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        최대 5MB, JPG/PNG 형식
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleSaveItem}
                  disabled={isLoading}
                  size="sm"
                  className="flex-1"
                >
                  {isLoading ? "저장 중..." : "저장"}
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  취소
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                아직 등록된 물품이 없습니다.
              </p>
              <Button
                onClick={() => setIsEditingItem(true)}
                size="sm"
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                물품 등록하기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          경매 물품을 등록하여 참가자들과 공유하세요.
        </AlertDescription>
      </Alert>

      {/* 경매 진행 정보 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">진행 안내</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>방 ID:</span>
            <Badge variant="outline" className="text-xs">
              {roomId}
            </Badge>
          </div>
          <Separator />
          <p>• 라운드별로 한 번씩 입찰 가능</p>
          <p>• 입찰 금액은 즉시 차감</p>
          <p>• 라운드 종료 후 결과 공개</p>
        </CardContent>
      </Card>
    </aside>
  )
}
