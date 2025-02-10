// https://www.shadcnblocks.com/block/navbar1/

import { NavLink, Link } from 'react-router'
import { Book, Menu, Sunset, Trees, Zap, House, Building, Factory, BrickWall, Wrench } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { useEffect, useState, useContext } from 'react'
import UserContext from './context/UserContext'
import Logo from '/logo_transparent.png'

const AppNavbar = ({
  logo = {
    url: "/",
    // src: "https://www.shadcnblocks.com/images/block/block-1.svg",
    src: Logo,
    alt: "logo",
    title: "ProjectPilot",
  },
  menuPROP = [
    { title: "Home", url: "/" },
    {
        title: "Projects",
        url: "/",
        items: [
          {
            title: "123 Main St",
            description: "123 Main St Project",
            icon: <House className="size-5 shrink-0" />,
            url: "/",
          },
        ],
    },
    {
        title: "Tasks",
        description: "View Task Cards",
        icon: <Book className="size-5 shrink-0" />,
        url: "/tasks",
    },
    {
        title: "List",
        description: "View List of Tasks",
        icon: <Book className="size-5 shrink-0" />,
        url: "/list",
    },
    {
        title: "Schedule",
        description: "View Schedule",
        icon: <Book className="size-5 shrink-0" />,
        url: "/schedule",
    },
    // {
    //   title: "Products",
    //   url: "#",
    //   items: [
    //     {
    //       title: "Blog",
    //       description: "The latest industry news, updates, and info",
    //       icon: <Book className="size-5 shrink-0" />,
    //       url: "#",
    //     },
    //     {
    //       title: "Company",
    //       description: "Our mission is to innovate and empower the world",
    //       icon: <Trees className="size-5 shrink-0" />,
    //       url: "#",
    //     },
    //     {
    //       title: "Careers",
    //       description: "Browse job listing and discover our workspace",
    //       icon: <Sunset className="size-5 shrink-0" />,
    //       url: "#",
    //     },
    //     {
    //       title: "Support",
    //       description:
    //         "Get in touch with our support team or visit our community forums",
    //       icon: <Zap className="size-5 shrink-0" />,
    //       url: "#",
    //     },
    //   ],
    // },
    // {
    //   title: "Resources",
    //   url: "#",
    //   items: [
    //     {
    //       title: "Help Center",
    //       description: "Get all the answers you need right here",
    //       icon: <Zap className="size-5 shrink-0" />,
    //       url: "#",
    //     },
    //     {
    //       title: "Contact Us",
    //       description: "We are here to help you with any questions you have",
    //       icon: <Sunset className="size-5 shrink-0" />,
    //       url: "#",
    //     },
    //     {
    //       title: "Status",
    //       description: "Check the current status of our services and APIs",
    //       icon: <Trees className="size-5 shrink-0" />,
    //       url: "#",
    //     },
    //     {
    //       title: "Terms of Service",
    //       description: "Our terms and conditions for using our services",
    //       icon: <Book className="size-5 shrink-0" />,
    //       url: "#",
    //     },
    //   ],
    // },
    // {
    //   title: "Pricing",
    //   url: "#",
    // },
    // {
    //   title: "Blog",
    //   url: "#",
    // },
  ],
  mobileExtraLinks = [
    { name: "Elchonon Klafter", url: "https://klaftech.com" },
    // { name: "Press", url: "#" },
    // { name: "Contact", url: "#" },
    // { name: "Imprint", url: "#" },
    // { name: "Sitemap", url: "#" },
  ],
  auth = {
    login: { text: "Log in", url: "/login" },
    logout: { text: "Logout", url: "/logout" },
    signup: { text: "Sign up", url: "/signup" },
  },
}) => {
  

  // ********************************************************************
  // ********************* BEGIN PROJECTS LOADING ***********************
  // ********************************************************************
  const {user, setUser} = useContext(UserContext);
  //const {project, setProject} = useContext(ProjectContext);
  //console.log("InNav: ",project)
  
  const [projects, setProjects] = useState([])

  useEffect(() => {
    fetchProjects()
  }, [user])
  //trigger reload on user context change (login or full reload)

  const fetchProjects = () => (
      fetch('/api/projects')
      .then(res => {
          if(res.ok){
              res.json()
              .then(data => {
                  setProjects(data)
                  console.log("projects loaded into Navbar")
              })
          } else {
              console.log('failed to fetch projects')
          }
      })
  )
  // ********************************************************************
  // *********************** ENG PROJECTS LOADING ***********************
  // ********************************************************************

  
  const projectTypeIcons = {
    house: <House className="size-5 shrink-0" />,
    commercial: <Building className="size-5 shrink-0" />,
    industrial: <Factory className="size-5 shrink-0" />,
    renovation: <BrickWall className="size-5 shrink-0" />,
  }

  const renderProjectMenuItems = (project) => {
    return {
      key: project.id,
      title: project.name,
      description: project.description,
      icon: projectTypeIcons[project.project_type] ?? <Wrench className="size-5 shrink-0" />,
      url: "/project/"+project.id,
    }
  }

  const menu = [
    { title: "Home", url: "/" },
    {
        title: "Projects",
        url: "/",
        items: projects.map(project => renderProjectMenuItems(project)),
        // items: [
        //   {
        //     title: "123 Main St",
        //     description: "123 Main St Project",
        //     icon: <House className="size-5 shrink-0" />,
        //     url: "/",
        //   },
        // ],
    },
    {
        title: "Tasks",
        description: "View Task Cards",
        icon: <Book className="size-5 shrink-0" />,
        url: "/tasks",
    },
    {
        title: "List",
        description: "View List of Tasks",
        icon: <Book className="size-5 shrink-0" />,
        url: "/list",
    },
    {
        title: "Schedule",
        description: "View Schedule",
        icon: <Book className="size-5 shrink-0" />,
        url: "/schedule",
    },
    // {
    //   title: "Products",
    //   url: "#",
    //   items: [
    //     {
    //       title: "Blog",
    //       description: "The latest industry news, updates, and info",
    //       icon: <Book className="size-5 shrink-0" />,
    //       url: "#",
    //     },
    //     {
    //       title: "Company",
    //       description: "Our mission is to innovate and empower the world",
    //       icon: <Trees className="size-5 shrink-0" />,
    //       url: "#",
    //     },
    //     {
    //       title: "Careers",
    //       description: "Browse job listing and discover our workspace",
    //       icon: <Sunset className="size-5 shrink-0" />,
    //       url: "#",
    //     },
    //     {
    //       title: "Support",
    //       description:
    //         "Get in touch with our support team or visit our community forums",
    //       icon: <Zap className="size-5 shrink-0" />,
    //       url: "#",
    //     },
    //   ],
    // },
    // {
    //   title: "Resources",
    //   url: "#",
    //   items: [
    //     {
    //       title: "Help Center",
    //       description: "Get all the answers you need right here",
    //       icon: <Zap className="size-5 shrink-0" />,
    //       url: "#",
    //     },
    //     {
    //       title: "Contact Us",
    //       description: "We are here to help you with any questions you have",
    //       icon: <Sunset className="size-5 shrink-0" />,
    //       url: "#",
    //     },
    //     {
    //       title: "Status",
    //       description: "Check the current status of our services and APIs",
    //       icon: <Trees className="size-5 shrink-0" />,
    //       url: "#",
    //     },
    //     {
    //       title: "Terms of Service",
    //       description: "Our terms and conditions for using our services",
    //       icon: <Book className="size-5 shrink-0" />,
    //       url: "#",
    //     },
    //   ],
    // },
    // {
    //   title: "Pricing",
    //   url: "#",
    // },
    // {
    //   title: "Blog",
    //   url: "#",
    // },
  ]
  
  return (
    <section className="py-4">
      <div className="container">
        <nav className="hidden justify-between lg:flex">
          <div className="flex items-center gap-6">
            <NavLink to={logo.url} className="flex items-center gap-2">
              <img src={logo.src} className="w-8" alt={logo.alt} />
              <span className="text-lg font-semibold">{logo.title}</span>
            </NavLink>
            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {menu.map((item) => renderMenuItem(item))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
          <div className="flex gap-2">
            <NavLink to={auth.signup.url}>
                <Button className="flex gap-2" variant="outline" size="sm">
                    {auth.signup.text}
                </Button>
            </NavLink>
            <NavLink to={auth.logout.url}>
                {/* <Button asChild size="sm"> */}
                <Button className="flex gap-2" size="sm">
                    {auth.logout.text}
                </Button>
            </NavLink>
          </div>
        </nav>
        <div className="block lg:hidden">
          <div className="flex items-center justify-between">
            <NavLink to={logo.url} className="flex items-center gap-2">
              <img src={logo.src} className="w-8" alt={logo.alt} />
              <span className="text-lg font-semibold">{logo.title}</span>
            </NavLink>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <NavLink to={logo.url} className="flex items-center gap-2">
                      <img src={logo.src} className="w-8" alt={logo.alt} />
                      <span className="text-lg font-semibold">
                        {logo.title}
                      </span>
                    </NavLink>
                  </SheetTitle>
                </SheetHeader>
                <div className="my-6 flex flex-col gap-6">
                  <Accordion
                    type="single"
                    collapsible
                    className="flex w-full flex-col gap-4"
                  >
                    {menu.map((item) => renderMobileMenuItem(item))}
                  </Accordion>
                  <div className="border-t py-4">
                    <div className="grid grid-cols-2 justify-start">
                      {mobileExtraLinks.map((link, idx) => (
                        <NavLink
                          key={idx}
                          className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-accent-foreground"
                          to={link.url}
                        >
                          {link.name}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <NavLink className="flex flex-col gap-3" to={auth.signup.url}>
                        <Button variant="outline">
                            {auth.signup.text}
                        </Button>
                    </NavLink>
                    <NavLink className="flex flex-col gap-3" to={auth.logout.url}>
                        <Button>
                            {auth.logout.text}
                        </Button>
                    </NavLink>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  );
};

const renderMenuItem = (item) => {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title} className="text-muted-foreground">
        <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="w-80 p-3">
            <NavigationMenuLink>
              {item.items.map((subItem) => (
                <li key={subItem.title}>
                  <NavLink
                    className="flex select-none gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
                    to={subItem.url}
                  >
                    {subItem.icon}
                    <div>
                      <div className="text-sm font-semibold">
                        {subItem.title}
                      </div>
                      {subItem.description && (
                        <p className="text-sm leading-snug text-muted-foreground">
                          {subItem.description}
                        </p>
                      )}
                    </div>
                  </NavLink>
                </li>
              ))}
            </NavigationMenuLink>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavLink
      key={item.title}
      className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-accent-foreground"
      to={item.url}
    >
      {item.title}
    </NavLink>
  );
};

const renderMobileMenuItem = (item) => {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="py-0 font-semibold hover:no-underline">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="mt-2">
          {item.items.map((subItem) => (
            <NavLink
              key={subItem.title}
              className="flex select-none gap-4 rounded-md p-3 leading-none outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
              to={subItem.url}
            >
              {subItem.icon}
              <div>
                <div className="text-sm font-semibold">{subItem.title}</div>
                {subItem.description && (
                  <p className="text-sm leading-snug text-muted-foreground">
                    {subItem.description}
                  </p>
                )}
              </div>
            </NavLink>
          ))}
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <NavLink key={item.title} to={item.url} className="font-semibold">
      {item.title}
    </NavLink>
  );
};

export default AppNavbar;
