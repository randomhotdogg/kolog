"use client"

import { BadgeCheck, Instagram, Twitter, Github } from "lucide-react"

export default function Footer() {
  return (
    <footer className="w-full bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-6 md:space-y-0">
          {/* Brand Section */}
          <div className="flex items-center space-x-3">
          <BadgeCheck className="h-6 w-6 text-emerald-600" />
          <span className="font-bold text-lg text-gray-900">KOLOG</span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-8 text-sm text-gray-600">
            <a href="#" className="hover:text-gray-900 transition-colors">探索</a>
            <a href="#" className="hover:text-gray-900 transition-colors">定價</a>
            <a href="#" className="hover:text-gray-900 transition-colors">幫助</a>
          </div>

          {/* Social Links */}
          <div className="flex items-center space-x-4">
            <a href="#" className="w-10 h-10 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm">
              <Instagram className="w-5 h-5 text-gray-600" />
            </a>
            <a href="#" className="w-10 h-10 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm">
              <Twitter className="w-5 h-5 text-gray-600" />
            </a>
            <a href="#" className="w-10 h-10 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm">
              <Github className="w-5 h-5 text-gray-600" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}