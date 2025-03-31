// https://www.shadcnblocks.com/block/navbar1/

import { NavLink, Link } from 'react-router'
import { Book, Menu, Sunset, Trees, Zap, House, Building, Factory, BrickWall, Wrench, SquareCheck } from "lucide-react";

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
import UserContext from '@/context/UserContext'
import ActiveProjectContext from '@/context/ActiveProjectContext'
import ProjectsContext from '@/context/ProjectsContext'
import UnitsContext from '@/context/UnitsContext'
import Logo from '/logo_transparent.png'
import { useUpdateUser } from '@/hooks/useUpdateUser'

const AppNavbar = ({
  logo = {
    url: "/",
    // src: "https://www.shadcnblocks.com/images/block/block-1.svg",
    src: Logo,
    alt: "logo",
    title: "ProjectPilot",
  },
  /*
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
  */
  mobileExtraLinks = [
    { name: "Developed by Elchonon Klafter", url: "https://klaftech.com" },
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
  
  const updateUser = useUpdateUser()

  // ********************************************************************
  // ***************** BEGIN PROJECTS & UNITS LOADING *******************
  // ********************************************************************
  const {user, setUser} = useContext(UserContext);
  const {activeProject, setActiveProject} = useContext(ActiveProjectContext);
  const {projects, setProjects} = useContext(ProjectsContext);
  const {units, setUnits} = useContext(UnitsContext);

  //update unit dropdown list on project change
  useEffect(() => {
    let new_units = []
    const project = projects.filter(project => project.id == activeProject.id)
    if (project.length > 0){
      new_units = project[0].units
    } else {
      new_units = []
    }
    setUnits(new_units)
  }, [activeProject])

  useEffect(() => {
    if(projects.length <= 0){
      fetchProjects()
      //console.log("projects fetch")
    }
  }, [])

  useEffect(() => {
    updateActiveProject()
  }, [projects])

  const updateActiveProject = (project_id=user.selectedProject) => {
    const filterResults = projects.filter(project => project.id == project_id)
    if (filterResults.length > 0){
      
      const project = filterResults[0]
      
      // update context
      setActiveProject(project)

      // save change to user profile in context
      updateUser({selectedProject: project.id})
    }
  }

  const fetchProjects = () => (
    fetch('/api/projects/minimal')
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

  // console.log(user)
  // console.log(projects)
  // console.log(units)
  // ********************************************************************
  // ***************** ENG PROJECTS & UNIT LOADING **********************
  // ********************************************************************

  const handleProjectClick = (e, project_id) => {
    //console.log("project clicked "+project_id)
    
    updateActiveProject(project_id)
    // const filterResults = projects.filter(project => project.id == project_id)
    // if (filterResults.length > 0){
      
    //   const project = filterResults[0]
      
    //   // update context
    //   setActiveProject(project)

    //   // save change to user profile in context
    //   updateUser({selectedProject: project.id})
    // } else {
    //   console.log("Fatal Error. Project selected not found in menu")
    //   //e.preventDefault()
    // }
  }

  const handleUnitClick = (e, unit_id) => {
    e.preventDefault()
    //console.log("updating selectedUnit in profile to: "+unit_id)

    // save change to user profile in context
    updateUser({selectedUnit: unit_id})
  }


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
      icon: projectTypeIcons[project.project_type] ?? <SquareCheck className="size-5 shrink-0" />,
      url: "/project/"+project.id,
      onClick: handleProjectClick,
    }
  }

  const renderUnitMenuItems = (unit) => {
    return {
      key: unit.id,
      title: unit.name,
      description: '',
      icon: <SquareCheck className="size-5 shrink-0" />,
      url: "/unit/"+unit.id,
      onClick: handleUnitClick,
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
        title: "Units",
        url: "/",
        items: units.map(unit => renderUnitMenuItems(unit)),
    },
    // {
    //     title: "Tasks",
    //     description: "View Task Cards",
    //     icon: <Book className="size-5 shrink-0" />,
    //     url: "/tasks",
    // },
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
    {
      title: "Overview",
      description: "Project Overview",
      icon: <Book className="size-5 shrink-0" />,
      url: "/overview",
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
    <section className="py-4 pr-4 pl-4">
      <div className="container">

        {/* Desktop Menu */}
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
            {/* <NavLink to={auth.signup.url}>
                <Button className="flex gap-2" variant="outline" size="sm">
                    {auth.signup.text}
                </Button>
            </NavLink> */}
            <NavLink to={auth.logout.url}>
                {/*<Button asChild size="sm">*/}
                <Button className="flex gap-2" size="sm">
                    {auth.logout.text}
                </Button>
            </NavLink>
          </div>
        </nav>

        {/* Mobile Menu */}
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
                    {/* <NavLink className="flex flex-col gap-3" to={auth.signup.url}>
                        <Button variant="outline">
                            {auth.signup.text}
                        </Button>
                    </NavLink> */}
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
            {item.items.map((subItem) => (
              <li key={subItem.title}>
                <NavigationMenuLink asChild>
                  <Link
                    className="flex select-none gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
                    to={subItem.url}
                    onClick={subItem.onClick ? e => subItem.onClick(e, subItem.key) : null}
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
                  </Link>
                </NavigationMenuLink>
              </li>
            ))}
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
              onClick={subItem.onClick ? e => subItem.onClick(e, subItem.key) : null}
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
