import React from "react"
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from "./select"
import { Dialog,DialogContent,DialogDescription,DialogFooter,DialogTitle } from "./dialog"
import { Button } from "./button"
export type Choice={value:string;label:string}
export function ChoiceSelect({label,value,options,onChange,placeholder,disabled,className}:{label:string;value:string;options:Choice[];onChange:(value:string)=>void;placeholder?:string;disabled?:boolean;className?:string}){
 return <Select value={value} onValueChange={onChange} disabled={disabled}><SelectTrigger aria-label={label} size="sm" className={className}><SelectValue placeholder={placeholder}/></SelectTrigger><SelectContent align="start">{options.map(x=><SelectItem key={x.value} value={x.value}>{x.label}</SelectItem>)}</SelectContent></Select>
}
export function ConfirmDialog({open,title,description,cancel,confirm,onCancel,onConfirm,destructive=false}:{open:boolean;title:string;description:string;cancel:string;confirm:string;onCancel:()=>void;onConfirm:()=>void;destructive?:boolean}){
 return <Dialog open={open} onOpenChange={v=>{if(!v)onCancel()}}><DialogContent showCloseButton={false}><DialogTitle>{title}</DialogTitle><DialogDescription className="wb-dialog-description">{description}</DialogDescription><DialogFooter><Button size="sm" variant="outline" onClick={onCancel}>{cancel}</Button><Button size="sm" variant={destructive?"destructive":"default"} onClick={onConfirm}>{confirm}</Button></DialogFooter></DialogContent></Dialog>
}
