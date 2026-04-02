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

const TagSelector = ({
  category,
  availableTags = [],
  selectedTags = [],
  onTagsChange,
  onAddCustomTag,
  maxTags = 10,
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [selectValue, setSelectValue] = useState('');

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
        toast.warning(`最多只能选择 ${maxTags} 个标签`);
        return;
      }
      onTagsChange([...selectedTags, value]);
      setSelectValue('');
    }
  };

  const handleAddCustomTag = async () => {
    const trimmedTag = customTag.trim();
    if (!trimmedTag) {
      toast.error('请输入标签名称');
      return;
    }

    // 检查是否已存在
    if (selectedTags.includes(trimmedTag)) {
      toast.error('该标签已选择');
      return;
    }

    if (availableTags.includes(trimmedTag)) {
      // 如果标签已存在于列表中，直接添加
      onTagsChange([...selectedTags, trimmedTag]);
    } else {
      // 如果是新标签，先保存到数据库
      const result = await onAddCustomTag(category, trimmedTag);
      if (result.success) {
        onTagsChange([...selectedTags, trimmedTag]);
      }
    }

    setCustomTag('');
    setShowCustomInput(false);
  };

  const handleRemoveTag = (tagToRemove) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-3">
      {/* 已选择的标签展示 */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 flex items-center gap-1"
            >
              <Tag className="w-3 h-3" />
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* 标签选择下拉框 */}
      {!showCustomInput ? (
        <Select value={selectValue} onValueChange={handleSelectTag}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={`选择${category}标签（已选择 ${selectedTags.length}/${maxTags}）`} />
          </SelectTrigger>
          <SelectContent>
            {filteredTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
            <SelectItem value="custom" className="text-purple-600 font-medium">
              <Plus className="w-4 h-4 inline mr-1" />
              添加自定义标签...
            </SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder="输入新标签名称"
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
          <Button onClick={handleAddCustomTag} size="sm" className="bg-purple-600">
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
            取消
          </Button>
        </div>
      )}

      {selectedTags.length === 0 && (
        <p className="text-xs text-gray-500">请至少选择一个标签</p>
      )}
    </div>
  );
};

export default TagSelector;
