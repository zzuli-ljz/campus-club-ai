import { useState } from "react";
import { format, setHours, setMinutes } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLanguage } from "@/contexts/LanguageContext";

export function DateTimePicker({ date, onDateChange, className, placeholder }) {
  const { language } = useLanguage();
  const defaultPlaceholder = language === "zh" ? "选择日期和时间" : "Select date and time";
  const displayPlaceholder = placeholder || defaultPlaceholder;
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(date ? new Date(date) : null);
  const [selectedHour, setSelectedHour] = useState(date ? new Date(date).getHours() : 12);
  const [selectedMinute, setSelectedMinute] = useState(date ? new Date(date).getMinutes() : 0);

  const handleDateSelect = (newDate) => {
    if (!newDate) {
      setSelectedDate(null);
      return;
    }
    
    // 将时间设置到选中的日期
    const newDateWithTime = setMinutes(setHours(newDate, selectedHour), selectedMinute);
    setSelectedDate(newDateWithTime);
    
    if (onDateChange) {
      onDateChange(newDateWithTime);
    }
  };

  const handleTimeChange = (type, value) => {
    const numValue = parseInt(value, 10);
    let newDate = selectedDate || new Date();
    
    if (type === 'hour') {
      setSelectedHour(numValue);
      newDate = setHours(newDate, numValue);
    } else {
      setSelectedMinute(numValue);
      newDate = setMinutes(newDate, numValue);
    }
    
    setSelectedDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  const handleConfirm = () => {
    if (selectedDate && onDateChange) {
      onDateChange(selectedDate);
    }
    setIsOpen(false);
  };

  // 生成小时选项
  const hours = Array.from({ length: 24 }, (_, i) => i);
  // 生成分钟选项
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            format(selectedDate, language === "zh" ? "yyyy年MM月dd日 HH:mm" : "MM/dd/yyyy HH:mm")
          ) : (
            <span>{displayPlaceholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          {/* 日历选择 */}
          <div className="border-b pb-4 mb-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              disabled={(date) => date < new Date().setHours(0, 0, 0, 0)}
            />
          </div>
          
          {/* 时间选择 */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground mr-2">{language === "zh" ? "时间：" : "Time:"}</span>
            
            {/* 小时选择 */}
            <select
              value={selectedHour}
              onChange={(e) => handleTimeChange('hour', e.target.value)}
              className="border rounded px-2 py-1 text-sm bg-background"
            >
              {hours.map((h) => (
                <option key={h} value={h}>
                  {h.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
            
            <span className="text-muted-foreground">:</span>
            
            {/* 分钟选择 */}
            <select
              value={selectedMinute}
              onChange={(e) => handleTimeChange('minute', e.target.value)}
              className="border rounded px-2 py-1 text-sm bg-background"
            >
              {minutes.map((m) => (
                <option key={m} value={m}>
                  {m.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>
          
          {/* 快捷时间按钮 */}
          <div className="flex gap-2 mt-3 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const now = new Date();
                handleTimeChange('hour', now.getHours());
                handleTimeChange('minute', Math.ceil(now.getMinutes() / 5) * 5);
                handleDateSelect(now);
              }}
            >
              {language === "zh" ? "现在" : "Now"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                handleTimeChange('hour', 9);
                handleTimeChange('minute', 0);
                handleDateSelect(tomorrow);
              }}
            >
              {language === "zh" ? "明早9点" : "9am Tomorrow"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const date = selectedDate || new Date();
                handleTimeChange('hour', 18);
                handleTimeChange('minute', 0);
                handleDateSelect(date);
              }}
            >
              18:00
            </Button>
          </div>
          
          {/* 确认按钮 */}
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              {language === "zh" ? "取消" : "Cancel"}
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={!selectedDate}
            >
              {language === "zh" ? "确认" : "Confirm"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
