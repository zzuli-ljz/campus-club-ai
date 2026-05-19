// AI辅助生成：豆包AI, 2026-03-31
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

// AI辅助生成：豆包AI, 2026-03-31
const TagSelector = ({
  category,
  availableTags = [],
  selectedTags = [],
  onTagsChange,
  onAddCustomTag,
  maxTags = 10,
  allowCustomTags = true,
  showPendingTags = false,
  pendingTags = [],
}) => {
  // AI辅助生成：豆包AI, 2026-03-31
  const { t, language } = useLanguage();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [selectValue, setSelectValue] = useState('');

  // AI辅助生成：豆包AI, 2026-03-31
  // 过滤掉已选择的标签
  const filteredTags = availableTags.filter(tag => !selectedTags.includes(tag));

  const handleSelectTag = (value) => {
    if (value === 'custom') {
      setShowCustomInput(true);
      setSelectValue('');
      return;
    }

    if (value && !selectedTags.includes(value)) {
      if (selectedTags.length >= maxTags) {
        toast.warning(language === "zh" ? `最多只能选择 ${maxTags} 个标签` : `Maximum ${maxTags} tags allowed`);
        return;
      }
      onTagsChange([...selectedTags, value]);
      setSelectValue('');
    }
  };

  // AI辅助生成：豆包AI, 2026-03-31
  const handleAddCustomTag = async () => {
    const trimmedTag = customTag.trim();
    if (!trimmedTag) {
      toast.error(language === "zh" ? '请输入标签名称' : 'Please enter tag name');
      return;
    }

    // 检查是否已存在
    if (selectedTags.includes(trimmedTag)) {
      toast.error(language === "zh" ? '该标签已选择' : 'Tag already selected');
      return;
    }

    if (availableTags.includes(trimmedTag)) {
      // 如果标签已存在于列表中，直接添加
      onTagsChange([...selectedTags, trimmedTag]);
    } else {
      // 如果是新标签
      if (onAddCustomTag) {
        // 如果有 onAddCustomTag，则调用（用于直接保存到数据库的场景）
        const result = await onAddCustomTag(category, trimmedTag);
        if (result.success) {
          onTagsChange([...selectedTags, trimmedTag]);
        }
      } else {
        // 如果没有 onAddCustomTag，直接添加到已选标签（预添加模式）
        onTagsChange([...selectedTags, trimmedTag]);
        toast.success(language === "zh" ? `已添加新标签：${trimmedTag}（审核后生效）` : `New tag added: ${trimmedTag} (effective after review)`);
      }
    }

    setCustomTag('');
    setShowCustomInput(false);
  };

  const handleRemoveTag = (tagToRemove) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  // AI辅助生成：豆包AI, 2026-03-31
  return (
    <div className="space-y-3">
      {/* 已选择的标签展示 */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => {
            const isNewTag = !availableTags.includes(tag);
            return (
              <Badge
                key={tag}
                variant="secondary"
                className={`px-3 py-1 flex items-center gap-1 ${
                  isNewTag
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
                title={isNewTag ? (language === "zh" ? '新标签（审核后生效）' : 'New tag (effective after review)') : ''}
              >
                <Tag className="w-3 h-3" />
                {tag}
                {isNewTag && (
                  <span className="text-xs ml-1 opacity-70">
                    {language === "zh" ? '新' : 'New'}
                  </span>
                )}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-blue-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* 标签选择下拉框 */}
      {!showCustomInput ? (
        <Select value={selectValue} onValueChange={handleSelectTag}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={language === "zh" ? `选择${category}标签（已选择 ${selectedTags.length}/${maxTags}）` : `Select ${category} tags (${selectedTags.length}/${maxTags} selected)`} />
          </SelectTrigger>
          <SelectContent>
            {filteredTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
            <SelectItem value="custom" className="text-blue-700 font-medium">
              <Plus className="w-4 h-4 inline mr-1" />
              {language === "zh" ? "添加自定义标签..." : "Add custom tag..."}
            </SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder={language === "zh" ? "输入新标签名称" : "Enter new tag name"}
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomTag();
              }
            }}
            autoFocus
          />
          <Button onClick={handleAddCustomTag} size="sm" className="bg-blue-600">
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowCustomInput(false);
              setCustomTag('');
            }}
          >
            {language === "zh" ? "取消" : "Cancel"}
          </Button>
        </div>
      )}

      {selectedTags.length === 0 && (
        <p className="text-xs text-gray-500">{language === "zh" ? "请至少选择一个标签" : "Please select at least one tag"}</p>
      )}
    </div>
  );
};

export default TagSelector;
